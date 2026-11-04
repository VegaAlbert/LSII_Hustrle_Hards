package com.tecnocampus.LS2.protube_back.controller.dto;

import com.tecnocampus.LS2.protube_back.domain.Video;

import java.time.Instant;

/**
 * Video shown in the list. {@code thumbnailUrl} and {@code videoUrl} are paths under {@code /media}; the video file
 * is used for the preview played when the user hovers a card.
 */
public record VideoSummaryResponse(Long id, String title, String author, int durationSeconds, Instant publishedAt,
                                   String thumbnailUrl, String videoUrl) {

    public static VideoSummaryResponse from(Video video) {
        return new VideoSummaryResponse(video.getId(), video.getTitle(), video.getAuthor(),
                video.getDurationSeconds(), video.getPublishedAt(), "/media/" + video.getThumbnailFile(),
                "/media/" + video.getVideoFile());
    }
}
