package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.AuthResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.ChangeEmailRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.ChangePasswordRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.ChangeUsernameRequest;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.repository.CommentRepository;
import com.tecnocampus.LS2.protube_back.repository.SubscriptionRepository;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    VideoRepository videoRepository;

    @Mock
    CommentRepository commentRepository;

    @Mock
    SubscriptionRepository subscriptionRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    JwtService jwtService;

    @InjectMocks
    AccountService accountService;

    User alice;

    @BeforeEach
    void setUp() {
        alice = new User("alice", "alice@mail.com", "old-hash");
        lenient().when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
        lenient().when(jwtService.generateToken(anyString())).thenAnswer(invocation -> "token-" + invocation.getArgument(0));
    }

    @Test
    void changeUsernameRenamesUserAndItsUploadsAndReturnsNewToken() {
        AuthResponse response = accountService.changeUsername("alice", new ChangeUsernameRequest(" alicia "));

        assertEquals("alicia", alice.getUsername());
        verify(videoRepository).renameAuthorOfUploads(alice, "alicia");
        verify(commentRepository).renameAuthor(alice, "alicia");
        verify(subscriptionRepository).renameChannel("alice", "alicia");
        assertEquals("token-alicia", response.token());
        assertEquals("alicia", response.user().username());
    }

    @Test
    void changeUsernameRejectsTakenUsername() {
        when(userRepository.existsByUsername("bob")).thenReturn(true);

        UserAlreadyExistsException e = assertThrows(UserAlreadyExistsException.class,
                () -> accountService.changeUsername("alice", new ChangeUsernameRequest("bob")));

        assertEquals("username", e.getField());
        assertEquals("alice", alice.getUsername());
        verify(videoRepository, never()).renameAuthorOfUploads(any(), any());
        verify(subscriptionRepository, never()).renameChannel(any(), any());
    }

    @Test
    void changeUsernameToTheSameOneChangesNothing() {
        AuthResponse response = accountService.changeUsername("alice", new ChangeUsernameRequest("alice"));

        assertEquals("alice", response.user().username());
        verify(userRepository, never()).existsByUsername(any());
        verify(videoRepository, never()).renameAuthorOfUploads(any(), any());
    }

    @Test
    void changeEmailSavesItInLowerCase() {
        AuthResponse response = accountService.changeEmail("alice", new ChangeEmailRequest(" Alice@New.com "));

        assertEquals("alice@new.com", alice.getEmail());
        assertEquals("alice@new.com", response.user().email());
    }

    @Test
    void changeEmailRejectsEmailOfAnotherAccount() {
        when(userRepository.existsByEmailIgnoreCase("bob@mail.com")).thenReturn(true);

        UserAlreadyExistsException e = assertThrows(UserAlreadyExistsException.class,
                () -> accountService.changeEmail("alice", new ChangeEmailRequest("bob@mail.com")));

        assertEquals("email", e.getField());
        assertEquals("alice@mail.com", alice.getEmail());
    }

    @Test
    void changeEmailToTheSameOneChangesNothing() {
        accountService.changeEmail("alice", new ChangeEmailRequest("ALICE@mail.com"));

        assertEquals("alice@mail.com", alice.getEmail());
        verify(userRepository, never()).existsByEmailIgnoreCase(any());
    }

    @Test
    void changePasswordChecksTheCurrentOne() {
        when(passwordEncoder.matches("old-password", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");

        accountService.changePassword("alice", new ChangePasswordRequest("old-password", "new-password"));

        assertEquals("new-hash", alice.getPasswordHash());
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() {
        when(passwordEncoder.matches("wrong", "old-hash")).thenReturn(false);

        InvalidAccountChangeException e = assertThrows(InvalidAccountChangeException.class,
                () -> accountService.changePassword("alice", new ChangePasswordRequest("wrong", "new-password")));

        assertEquals("currentPassword", e.getField());
        assertEquals("Current password is incorrect", e.getMessage());
        assertEquals("old-hash", alice.getPasswordHash());
    }

    @Test
    void changePasswordRequiresTheCurrentOneWhenTheAccountHasAPassword() {
        InvalidAccountChangeException e = assertThrows(InvalidAccountChangeException.class,
                () -> accountService.changePassword("alice", new ChangePasswordRequest(null, "new-password")));

        assertEquals("Current password is required", e.getMessage());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void googleAccountSetsItsFirstPasswordWithoutTheCurrentOne() {
        User carol = User.fromGoogle("carol", "carol@gmail.com", "random-hash", "g-carol");
        when(userRepository.findByUsername("carol")).thenReturn(Optional.of(carol));
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");

        AuthResponse response = accountService.changePassword("carol", new ChangePasswordRequest(null, "new-password"));

        assertEquals("new-hash", carol.getPasswordHash());
        assertTrue(response.user().hasPassword());
        assertTrue(response.user().googleLinked());
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    void changesFailWhenTheUserNoLongerExists() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class,
                () -> accountService.changeEmail("ghost", new ChangeEmailRequest("ghost@mail.com")));
    }
}
