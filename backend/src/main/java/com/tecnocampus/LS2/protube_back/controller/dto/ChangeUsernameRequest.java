package com.tecnocampus.LS2.protube_back.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Same rules as RegisterRequest
public record ChangeUsernameRequest(
        @NotBlank(message = "{validation.username.required}")
        @Size(min = 3, max = 30, message = "{validation.username.size}")
        @Pattern(regexp = "^[A-Za-z0-9_.-]*$", message = "{validation.username.pattern}")
        String username
) {
}
