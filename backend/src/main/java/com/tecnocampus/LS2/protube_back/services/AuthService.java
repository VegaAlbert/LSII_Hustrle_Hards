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
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleTokenVerifier googleTokenVerifier;

    // Same rules as RegisterRequest
    private static final int USERNAME_MIN = 3;
    private static final int USERNAME_MAX = 30;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                       GoogleTokenVerifier googleTokenVerifier) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleTokenVerifier = googleTokenVerifier;
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

    /**
     * "Sign in with Google": logs in the account with the same (verified) email, or creates one the first time.
     * Accounts created this way get a random password, so they can only log in with Google.
     */
    @Transactional
    public AuthResponse loginWithGoogle(String credential) {
        GoogleAccount account = googleTokenVerifier.verify(credential);

        User user = userRepository.findByEmail(account.email())
                .orElseGet(() -> userRepository.save(new User(
                        uniqueUsernameFor(account.email()),
                        account.email(),
                        passwordEncoder.encode(UUID.randomUUID().toString()))));

        return new AuthResponse(jwtService.generateToken(user.getUsername()), UserResponse.from(user));
    }

    /**
     * Builds a valid, free username from the part of the email before the '@' (e.g. "john.doe" -> "john.doe",
     * then "john.doe1", "john.doe2"... if it is taken).
     */
    private String uniqueUsernameFor(String email) {
        String base = email.substring(0, email.indexOf('@')).replaceAll("[^A-Za-z0-9_.-]", "");
        if (base.length() < USERNAME_MIN) {
            base = "user" + base;
        }
        // Leave room for a numeric suffix
        base = base.substring(0, Math.min(base.length(), USERNAME_MAX - 4));

        String candidate = base;
        for (int suffix = 1; userRepository.existsByUsername(candidate); suffix++) {
            candidate = base + suffix;
        }
        return candidate;
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        return userRepository.findByUsername(username)
                .map(UserResponse::from)
                .orElseThrow(InvalidCredentialsException::new);
    }
}
