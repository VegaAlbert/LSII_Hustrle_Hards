package com.tecnocampus.LS2.protube_back.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "{validation.username.required}")
        String username,

        @NotBlank(message = "{validation.password.required}")
        String password
) {
}
