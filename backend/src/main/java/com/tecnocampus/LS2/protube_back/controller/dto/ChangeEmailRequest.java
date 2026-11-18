package com.tecnocampus.LS2.protube_back.controller.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// Same rules as RegisterRequest
public record ChangeEmailRequest(
        @NotBlank(message = "{validation.email.required}")
        @Email(message = "{validation.email.invalid}")
        String email
) {
}
