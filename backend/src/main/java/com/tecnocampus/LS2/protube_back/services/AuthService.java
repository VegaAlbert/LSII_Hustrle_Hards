package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.AuthResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.LoginRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.RegisterRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.UserResponse;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * US-01: creates the account and logs the new user in straight away (returns a token).
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByUsername(username)) {
            throw new UserAlreadyExistsException("username", "Username is already taken");
        }
        if (userRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException("email", "Email is already registered");
        }

        User user = userRepository.save(new User(username, email, passwordEncoder.encode(request.password())));
        return new AuthResponse(jwtService.generateToken(user.getUsername()), UserResponse.from(user));
    }

    /**
     * US-02: checks the credentials and returns a token for the session.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username().trim())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(InvalidCredentialsException::new);

        return new AuthResponse(jwtService.generateToken(user.getUsername()), UserResponse.from(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        return userRepository.findByUsername(username)
                .map(UserResponse::from)
                .orElseThrow(InvalidCredentialsException::new);
    }
}
