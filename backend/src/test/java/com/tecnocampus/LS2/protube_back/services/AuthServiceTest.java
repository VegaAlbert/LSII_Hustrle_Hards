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
import static org.junit.jupiter.api.Assertions.assertThrows;
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
        when(userRepository.existsByEmail("alice@mail.com")).thenReturn(true);

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
}
