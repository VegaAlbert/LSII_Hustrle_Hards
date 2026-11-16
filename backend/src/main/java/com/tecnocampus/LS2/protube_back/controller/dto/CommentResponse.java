package com.tecnocampus.LS2.protube_back.controller.dto;

import com.tecnocampus.LS2.protube_back.domain.Comment;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * Comment shown on the video detail page. {@code publishedAt} can be null for imported comments without a date.
 * US-10: {@code likedByMe} tells if the viewer likes it (always false for anonymous visitors) and {@code replies}
 * holds its replies, oldest first (always empty for a reply, as there is only one level).
 */
public record CommentResponse(Long id, String author, String text, int likeCount, Instant publishedAt,
                              boolean likedByMe, List<CommentResponse> replies) {

    /**
     * A comment just created: nobody likes it yet and it has no replies.
     */
    public static CommentResponse from(Comment comment) {
        return from(comment, Set.of());
    }

    /**
     * @param likedCommentIds ids of the comments the viewer likes
     */
    public static CommentResponse from(Comment comment, Set<Long> likedCommentIds) {
        // A comment not saved yet has no id (and Set.of().contains(null) throws), so nobody can like it
        boolean likedByMe = comment.getId() != null && likedCommentIds.contains(comment.getId());
        return new CommentResponse(comment.getId(), comment.getAuthor(), comment.getText(), comment.getLikeCount(),
                comment.getPublishedAt(), likedByMe,
                comment.getReplies().stream().map(reply -> from(reply, likedCommentIds)).toList());
    }
}
