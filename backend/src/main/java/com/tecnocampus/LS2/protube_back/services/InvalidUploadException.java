package com.tecnocampus.LS2.protube_back.services;

/**
 * Thrown when an uploaded file is missing or not supported (US-06). {@code field} is the form field to highlight
 * ({@code video} or {@code thumbnail}). Mapped to 400 by ApiExceptionHandler.
 */
public class InvalidUploadException extends LocalizedException {

    private final String field;

    public InvalidUploadException(String field, String messageKey, String englishMessage) {
        super(messageKey, englishMessage);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
