package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.AuthResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.ChangeEmailRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.ChangePasswordRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.ChangeUsernameRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.UserResponse;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.repository.CommentRepository;
import com.tecnocampus.LS2.protube_back.repository.SubscriptionRepository;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * Account section of the settings: the logged-in user changes the username, email or password. It works the same
 * for accounts created with Google. Every change returns a new session: the token holds the username, so the old
 * one stops working after a rename.
 */
@Service
public class AccountService {

    private final UserRepository userRepository;
    private final VideoRepository videoRepository;
    private final CommentRepository commentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AccountService(UserRepository userRepository, VideoRepository videoRepository,
                          CommentRepository commentRepository, SubscriptionRepository subscriptionRepository,
                          PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.videoRepository = videoRepository;
        this.commentRepository = commentRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse changeUsername(String currentUsername, ChangeUsernameRequest request) {
        User user = find(currentUsername);
        String username = request.username().trim();

        if (!username.equals(user.getUsername())) {
            if (userRepository.existsByUsername(username)) {
                throw new UserAlreadyExistsException("username", "error.username.taken", "Username is already taken");
            }
            String oldUsername = user.getUsername();
            user.changeUsername(username);
            // Uploaded videos and comments show the username as author, and the channel of the user is its username
            videoRepository.renameAuthorOfUploads(user, username);
            commentRepository.renameAuthor(user, username);
            subscriptionRepository.renameChannel(oldUsername, username);
        }
        return session(user);
    }

    @Transactional
    public AuthResponse changeEmail(String currentUsername, ChangeEmailRequest request) {
        User user = find(currentUsername);
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (!email.equalsIgnoreCase(user.getEmail())) {
            // US-01: an email belongs to one account only
            if (userRepository.existsByEmailIgnoreCase(email)) {
                throw new UserAlreadyExistsException("email", "error.email.taken", "Email is already registered");
            }
            user.changeEmail(email);
        }
        return session(user);
    }

    @Transactional
    public AuthResponse changePassword(String currentUsername, ChangePasswordRequest request) {
        User user = find(currentUsername);

        if (user.isPasswordSet()) {
            String current = request.currentPassword();
            if (current == null || current.isEmpty()) {
                throw new InvalidAccountChangeException("currentPassword", "error.account.currentPasswordRequired",
                        "Current password is required");
            }
            if (!passwordEncoder.matches(current, user.getPasswordHash())) {
                throw new InvalidAccountChangeException("currentPassword", "error.account.currentPasswordIncorrect",
                        "Current password is incorrect");
            }
        }
        user.changePassword(passwordEncoder.encode(request.newPassword()));
        return session(user);
    }

    // The token was valid but its user no longer exists: same answer as GET /api/auth/me
    private User find(String username) {
        return userRepository.findByUsername(username).orElseThrow(InvalidCredentialsException::new);
    }

    private AuthResponse session(User user) {
        return new AuthResponse(jwtService.generateToken(user.getUsername()), UserResponse.from(user));
    }
}
