package com.tecnocampus.LS2.protube_back.services;

/**
 * US-13: a subscription that makes no sense, such as a user subscribing to their own channel. Answered with 400.
 */
public class InvalidSubscriptionException extends RuntimeException {

    public InvalidSubscriptionException(String message) {
        super(message);
    }
}
