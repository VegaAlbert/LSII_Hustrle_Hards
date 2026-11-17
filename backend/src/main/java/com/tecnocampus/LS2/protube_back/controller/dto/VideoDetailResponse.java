package com.tecnocampus.LS2.protube_back.controller.dto;

import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.domain.VideoCategory;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * Video shown on its detail page (US-05). {@code videoUrl} and {@code thumbnailUrl} are paths under {@code /media}.
 * {@code category} is null for imported videos, which also have no tags. {@code comments} only holds the top-level
 * comments, each with its replies (US-10).
 * {@code category} is null for imported videos, which also have no tags. {@code uploader} is the username of the owner
 * (null for imported videos): only that user can edit the video (US-07).
 */
public record VideoDetailResponse(Long id, String title, String description, String author, int durationSeconds,
                                  Integer width, Integer height, Instant publishedAt, String videoUrl,
                                  String thumbnailUrl, List<String> tags, VideoCategory category,
                                  boolean ageRestricted, String uploader, List<CommentResponse> comments) {

    /**
     * The video seen by an anonymous visitor or just uploaded: no comment is liked by the viewer.
     */
    public static VideoDetailResponse from(Video video) {
        return from(video, Set.of());
    }

    /**
     * @param likedCommentIds ids of the comments of this video the viewer likes (US-10)
     */
    public static VideoDetailResponse from(Video video, Set<Long> likedCommentIds) {
        return new VideoDetailResponse(video.getId(), video.getTitle(), video.getDescription(), video.getAuthor(),
                video.getDurationSeconds(), video.getWidth(), video.getHeight(), video.getPublishedAt(),
                "/media/" + video.getVideoFile(), "/media/" + video.getThumbnailFile(), List.copyOf(video.getTags()),
                video.getCategory(), video.isAgeRestricted(),
                video.getComments().stream()
                        // Replies are shown inside their comment, not in the main list
                        .filter(comment -> comment.getParent() == null)
                        .map(comment -> CommentResponse.from(comment, likedCommentIds))
                        .toList());
                video.getUploader() == null ? null : video.getUploader().getUsername(),
                video.getComments().stream().map(CommentResponse::from).toList());
    }
}
