package com.tecnocampus.LS2.protube_back.controller.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * @param credential the Google ID token returned by the "Sign in with Google" button
 */
public record GoogleLoginRequest(
        @NotBlank(message = "Google credential is required")
        String credential
) {
}
