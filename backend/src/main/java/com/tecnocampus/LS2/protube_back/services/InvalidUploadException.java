package com.tecnocampus.LS2.protube_back.services;

/**
 * Thrown when an uploaded file is missing or not supported (US-06). {@code field} is the form field to highlight
 * ({@code video} or {@code thumbnail}). Mapped to 400 by ApiExceptionHandler.
 */
public class InvalidUploadException extends RuntimeException {

    private final String field;

    public InvalidUploadException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
