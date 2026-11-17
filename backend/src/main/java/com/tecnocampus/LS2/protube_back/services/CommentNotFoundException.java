package com.tecnocampus.LS2.protube_back.services;

/**
 * Thrown when a comment id does not exist or belongs to another video. Mapped to 404 by ApiExceptionHandler.
 */
public class CommentNotFoundException extends RuntimeException {

    public CommentNotFoundException(Long id) {
        super("Comment " + id + " not found");
    }
}
