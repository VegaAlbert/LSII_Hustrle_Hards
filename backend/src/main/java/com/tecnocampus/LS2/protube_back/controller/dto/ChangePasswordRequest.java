package com.tecnocampus.LS2.protube_back.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * {@code currentPassword} is required only when the account already has a password: accounts created with Google
 * set their first one without it.
 */
public record ChangePasswordRequest(
        String currentPassword,

        @NotBlank(message = "{validation.newPassword.required}")
        @Size(min = 8, max = 72, message = "{validation.password.size}")
        String newPassword
) {
}
