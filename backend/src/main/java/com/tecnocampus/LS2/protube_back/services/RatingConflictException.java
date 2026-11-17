package com.tecnocampus.LS2.protube_back.services;

/**
 * Thrown when two ratings of the same user for the same video arrive at the same time and the database rejects the
 * second one (unique user/video pair). Mapped to 409 by ApiExceptionHandler.
 */
public class RatingConflictException extends RuntimeException {

    public RatingConflictException(Long videoId) {
        super("Your rating of video " + videoId + " was changed at the same time. Please try again");
    }
}
