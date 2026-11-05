package com.tecnocampus.LS2.protube_back.controller.dto;

import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.domain.VideoCategory;

import java.time.Instant;
import java.util.List;

/**
 * Video shown on its detail page (US-05). {@code videoUrl} and {@code thumbnailUrl} are paths under {@code /media}.
 * {@code category} is null for imported videos, which also have no tags.
 */
public record VideoDetailResponse(Long id, String title, String description, String author, int durationSeconds,
                                  Integer width, Integer height, Instant publishedAt, String videoUrl,
                                  String thumbnailUrl, List<String> tags, VideoCategory category,
                                  boolean ageRestricted, List<CommentResponse> comments) {

    public static VideoDetailResponse from(Video video) {
        return new VideoDetailResponse(video.getId(), video.getTitle(), video.getDescription(), video.getAuthor(),
                video.getDurationSeconds(), video.getWidth(), video.getHeight(), video.getPublishedAt(),
                "/media/" + video.getVideoFile(), "/media/" + video.getThumbnailFile(), List.copyOf(video.getTags()),
                video.getCategory(), video.isAgeRestricted(),
                video.getComments().stream().map(CommentResponse::from).toList());
    }
}
