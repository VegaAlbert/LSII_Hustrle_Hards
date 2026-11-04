package com.tecnocampus.LS2.protube_back.controller.dto;

import com.tecnocampus.LS2.protube_back.domain.Video;

import java.time.Instant;
import java.util.List;

/**
 * Video shown on its detail page (US-05). {@code videoUrl} and {@code thumbnailUrl} are paths under {@code /media}.
 */
public record VideoDetailResponse(Long id, String title, String description, String author, int durationSeconds,
                                  Integer width, Integer height, Instant publishedAt, String videoUrl,
                                  String thumbnailUrl, List<CommentResponse> comments) {

    public static VideoDetailResponse from(Video video) {
        return new VideoDetailResponse(video.getId(), video.getTitle(), video.getDescription(), video.getAuthor(),
                video.getDurationSeconds(), video.getWidth(), video.getHeight(), video.getPublishedAt(),
                "/media/" + video.getVideoFile(), "/media/" + video.getThumbnailFile(),
                video.getComments().stream().map(CommentResponse::from).toList());
    }
}
