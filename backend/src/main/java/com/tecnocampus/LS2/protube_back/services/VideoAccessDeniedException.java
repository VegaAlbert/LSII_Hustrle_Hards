package com.tecnocampus.LS2.protube_back.services;

/**
 * Thrown when a user tries to change a video they did not upload (US-07). Mapped to 403 by ApiExceptionHandler.
 */
public class VideoAccessDeniedException extends LocalizedException {

    public VideoAccessDeniedException(Long id) {
        super("error.video.accessDenied", "You can only edit your own videos (video " + id + ")", String.valueOf(id));
    }
}
