package com.tecnocampus.LS2.protube_back.services;

/**
 * Thrown when registering with a username or email that is already taken.
 * {@code field} tells the frontend which form field caused the error.
 */
public class UserAlreadyExistsException extends RuntimeException {

    private final String field;

    public UserAlreadyExistsException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
