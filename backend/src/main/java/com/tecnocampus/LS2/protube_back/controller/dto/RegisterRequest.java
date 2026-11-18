package com.tecnocampus.LS2.protube_back.controller.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "{validation.username.required}")
        @Size(min = 3, max = 30, message = "{validation.username.size}")
        @Pattern(regexp = "^[A-Za-z0-9_.-]*$", message = "{validation.username.pattern}")
        String username,

        @NotBlank(message = "{validation.email.required}")
        @Email(message = "{validation.email.invalid}")
        String email,

        @NotBlank(message = "{validation.password.required}")
        @Size(min = 8, max = 72, message = "{validation.password.size}")
        String password
) {
}
