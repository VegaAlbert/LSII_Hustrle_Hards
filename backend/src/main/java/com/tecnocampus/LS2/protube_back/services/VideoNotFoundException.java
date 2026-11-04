package com.tecnocampus.LS2.protube_back.services;

/**
 * Thrown when a video id does not exist. Mapped to 404 by ApiExceptionHandler.
 */
public class VideoNotFoundException extends RuntimeException {

    public VideoNotFoundException(Long id) {
        super("Video " + id + " not found");
    }
}
