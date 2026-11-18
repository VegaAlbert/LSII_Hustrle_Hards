package com.tecnocampus.LS2.protube_back.services;

/**
 * Thrown when a video id does not exist. Mapped to 404 by ApiExceptionHandler.
 */
public class VideoNotFoundException extends LocalizedException {

    public VideoNotFoundException(Long id) {
        super("error.video.notFound", "Video " + id + " not found", String.valueOf(id));
    }
}
