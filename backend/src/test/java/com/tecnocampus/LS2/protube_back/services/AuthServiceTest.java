package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.AuthResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.LoginRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.RegisterRequest;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    JwtService jwtService;

    @Mock
    GoogleTokenVerifier googleTokenVerifier;

    @InjectMocks
    AuthService authService;

    @Test
    void registerShouldStoreHashedPasswordAndReturnToken() {
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken("alice")).thenReturn("token");

        AuthResponse response = authService.register(new RegisterRequest(" alice ", " Alice@Mail.com ", "password123"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertEquals("alice", saved.getValue().getUsername());
        assertEquals("alice@mail.com", saved.getValue().getEmail());
        assertEquals("hashed", saved.getValue().getPasswordHash());
        assertEquals("token", response.token());
        assertEquals("alice", response.user().username());
    }

    @Test
    void registerShouldRejectTakenUsername() {
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        UserAlreadyExistsException e = assertThrows(UserAlreadyExistsException.class,
                () -> authService.register(new RegisterRequest("alice", "alice@mail.com", "password123")));

        assertEquals("username", e.getField());
        verify(userRepository, never()).save(any());
    }

    @Test
    void registerShouldRejectTakenEmail() {
        when(userRepository.existsByEmailIgnoreCase("alice@mail.com")).thenReturn(true);

        UserAlreadyExistsException e = assertThrows(UserAlreadyExistsException.class,
                () -> authService.register(new RegisterRequest("alice", "alice@mail.com", "password123")));

        assertEquals("email", e.getField());
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginShouldReturnTokenWithCorrectCredentials() {
        when(userRepository.findByUsername("alice"))
                .thenReturn(Optional.of(new User("alice", "alice@mail.com", "hashed")));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(jwtService.generateToken("alice")).thenReturn("token");

        AuthResponse response = authService.login(new LoginRequest("alice", "password123"));

        assertEquals("token", response.token());
        assertEquals("alice@mail.com", response.user().email());
    }

    @Test
    void loginShouldFailWithWrongPassword() {
        when(userRepository.findByUsername("alice"))
                .thenReturn(Optional.of(new User("alice", "alice@mail.com", "hashed")));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class,
                () -> authService.login(new LoginRequest("alice", "wrong")));
    }

    @Test
    void loginShouldFailWithUnknownUser() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class,
                () -> authService.login(new LoginRequest("ghost", "password123")));
    }

    @Test
    void getCurrentUserShouldReturnUser() {
        when(userRepository.findByUsername("alice"))
                .thenReturn(Optional.of(new User("alice", "alice@mail.com", "hashed")));

        assertEquals("alice", authService.getCurrentUser("alice").username());
    }

    @Test
    void getCurrentUserShouldFailWhenUserNoLongerExists() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.getCurrentUser("ghost"));
    }

    @Test
    void googleLoginShouldLinkAndLogInExistingAccountWithSameEmail() {
        User alice = new User("alice", "alice@mail.com", "hashed");
        when(googleTokenVerifier.verify("credential")).thenReturn(new GoogleAccount("g-1", "alice@mail.com", "Alice"));
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("alice@mail.com")).thenReturn(Optional.of(alice));
        when(jwtService.generateToken("alice")).thenReturn("token");

        AuthResponse response = authService.loginWithGoogle("credential");

        assertEquals("token", response.token());
        assertEquals("alice", response.user().username());
        assertEquals("g-1", alice.getGoogleId());
        // The account keeps the password it was registered with
        assertTrue(response.user().hasPassword());
        assertTrue(response.user().googleLinked());
        verify(userRepository, never()).save(any());
    }

    @Test
    void googleLoginShouldFindLinkedAccountEvenAfterItsEmailChanged() {
        User alice = User.fromGoogle("alice", "new@mail.com", "random-hash", "g-1");
        when(googleTokenVerifier.verify("credential")).thenReturn(new GoogleAccount("g-1", "old@gmail.com", "Alice"));
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.of(alice));
        when(jwtService.generateToken("alice")).thenReturn("token");

        AuthResponse response = authService.loginWithGoogle("credential");

        assertEquals("alice", response.user().username());
        assertEquals("new@mail.com", response.user().email());
        verify(userRepository, never()).findByEmailIgnoreCase(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void googleLoginShouldRejectEmailOfAccountLinkedToAnotherGoogleAccount() {
        User alice = User.fromGoogle("alice", "alice@gmail.com", "random-hash", "g-old");
        when(googleTokenVerifier.verify("credential")).thenReturn(new GoogleAccount("g-new", "alice@gmail.com", null));
        when(userRepository.findByGoogleId("g-new")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("alice@gmail.com")).thenReturn(Optional.of(alice));

        UserAlreadyExistsException e = assertThrows(UserAlreadyExistsException.class,
                () -> authService.loginWithGoogle("credential"));

        assertEquals("email", e.getField());
        assertEquals("g-old", alice.getGoogleId());
        verify(userRepository, never()).save(any());
    }

    @Test
    void googleLoginShouldCreateAccountOnFirstLogin() {
        when(googleTokenVerifier.verify("credential"))
                .thenReturn(new GoogleAccount("g-2", "john.doe+yt@gmail.com", "John"));
        when(userRepository.findByEmailIgnoreCase("john.doe+yt@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.existsByUsername("john.doeyt")).thenReturn(true);
        when(userRepository.existsByUsername("john.doeyt1")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("random-hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken("john.doeyt1")).thenReturn("token");

        AuthResponse response = authService.loginWithGoogle("credential");

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertEquals("john.doeyt1", saved.getValue().getUsername());
        assertEquals("john.doe+yt@gmail.com", saved.getValue().getEmail());
        assertEquals("random-hash", saved.getValue().getPasswordHash());
        assertEquals("g-2", saved.getValue().getGoogleId());
        assertEquals("token", response.token());
        // Nobody knows the random password: the settings ask to set one without the current password
        assertFalse(response.user().hasPassword());
    }

    @Test
    void googleLoginShouldBuildValidUsernameFromShortOrLongEmails() {
        when(googleTokenVerifier.verify("short")).thenReturn(new GoogleAccount("g-3", "ab@mail.com", null));
        when(googleTokenVerifier.verify("long")).thenReturn(new GoogleAccount("g-4", "a".repeat(40) + "@mail.com", null));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals("userab", authService.loginWithGoogle("short").user().username());
        assertEquals("a".repeat(26), authService.loginWithGoogle("long").user().username());
    }

    @Test
    void googleLoginShouldFailWithInvalidCredential() {
        when(googleTokenVerifier.verify("bad")).thenThrow(
                new InvalidGoogleTokenException("error.google.invalid", "Invalid Google credential"));

        assertThrows(InvalidGoogleTokenException.class, () -> authService.loginWithGoogle("bad"));
        verify(userRepository, never()).save(any());
    }
}
