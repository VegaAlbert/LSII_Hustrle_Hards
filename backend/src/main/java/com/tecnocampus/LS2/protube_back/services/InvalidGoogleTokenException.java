package com.tecnocampus.LS2.protube_back.services;

/**
 * Thrown when a "Sign in with Google" credential can't be trusted (bad signature, wrong audience, expired...)
 * or when Google login is not configured on the server.
 */
public class InvalidGoogleTokenException extends LocalizedException {

    public InvalidGoogleTokenException(String messageKey, String englishMessage) {
        super(messageKey, englishMessage);
    }
}
