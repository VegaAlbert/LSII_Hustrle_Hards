package com.tecnocampus.LS2.protube_back.controller.dto;

import com.tecnocampus.LS2.protube_back.domain.Comment;

import java.time.Instant;

/**
 * Comment shown on the video detail page. {@code publishedAt} can be null for imported comments without a date.
 */
public record CommentResponse(Long id, String author, String text, int likeCount, Instant publishedAt) {

    public static CommentResponse from(Comment comment) {
        return new CommentResponse(comment.getId(), comment.getAuthor(), comment.getText(), comment.getLikeCount(),
                comment.getPublishedAt());
    }
}
