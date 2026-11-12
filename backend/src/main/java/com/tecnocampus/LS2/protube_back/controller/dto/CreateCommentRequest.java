package com.tecnocampus.LS2.protube_back.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Body of POST /api/videos/{id}/comments (US-09).
 */
public record CreateCommentRequest(
        @NotBlank(message = "Comment is required")
        @Size(max = CreateCommentRequest.MAX_LENGTH,
                message = "Comment must be at most " + CreateCommentRequest.MAX_LENGTH + " characters")
        String text) {

    public static final int MAX_LENGTH = 1000;
}
