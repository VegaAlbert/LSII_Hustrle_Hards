package com.tecnocampus.LS2.protube_back.controller.dto;

/**
 * Answer of liking or unliking a comment (US-10): the new total and whether the user likes it now.
 */
public record CommentLikeResponse(int likeCount, boolean liked) {
}
