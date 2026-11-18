package com.tecnocampus.LS2.protube_back.controller.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// Same rules as RegisterRequest
public record ChangeEmailRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email is not valid")
        String email
) {
}
