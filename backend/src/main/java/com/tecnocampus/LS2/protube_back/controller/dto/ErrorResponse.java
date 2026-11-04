package com.tecnocampus.LS2.protube_back.controller.dto;

import java.util.Map;

/**
 * Error body returned by the API. {@code fieldErrors} maps each invalid form field to its message.
 */
public record ErrorResponse(String message, Map<String, String> fieldErrors) {

    public ErrorResponse(String message) {
        this(message, Map.of());
    }
}
