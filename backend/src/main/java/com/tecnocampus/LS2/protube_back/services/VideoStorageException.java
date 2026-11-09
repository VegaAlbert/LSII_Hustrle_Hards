package com.tecnocampus.LS2.protube_back.services;

/**
 * Thrown when the files of an uploaded video cannot be written to the video store. Mapped to 500 by
 * ApiExceptionHandler.
 */
public class VideoStorageException extends RuntimeException {

    public VideoStorageException(Throwable cause) {
        super("Could not store the video. Please try again later.", cause);
    }
}
