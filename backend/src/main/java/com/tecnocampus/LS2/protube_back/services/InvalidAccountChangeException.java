package com.tecnocampus.LS2.protube_back.services;

/**
 * Thrown when a change in the account settings is not allowed, e.g. a wrong current password.
 * {@code field} tells the frontend which form field caused the error.
 */
public class InvalidAccountChangeException extends RuntimeException {

    private final String field;

    public InvalidAccountChangeException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
