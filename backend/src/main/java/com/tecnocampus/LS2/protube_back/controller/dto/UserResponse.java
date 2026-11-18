package com.tecnocampus.LS2.protube_back.controller.dto;

import com.tecnocampus.LS2.protube_back.domain.User;

/**
 * {@code hasPassword} is false for accounts created with Google that have not set a password yet (the settings then
 * ask for a new password only). {@code googleLinked} tells whether the account can log in with Google.
 */
public record UserResponse(Long id, String username, String email, boolean hasPassword, boolean googleLinked) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.isPasswordSet(),
                user.getGoogleId() != null);
    }
}
