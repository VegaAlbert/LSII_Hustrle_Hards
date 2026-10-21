package com.tecnocampus.LS2.protube_back.controller.dto;

import com.tecnocampus.LS2.protube_back.domain.Video;

/**
 * Video shown in the list. {@code thumbnailUrl} is the path of the thumbnail under {@code /media}.
 */
public record VideoSummaryResponse(Long id, String title, String author, int durationSeconds, String thumbnailUrl) {

    public static VideoSummaryResponse from(Video video) {
        return new VideoSummaryResponse(video.getId(), video.getTitle(), video.getAuthor(),
                video.getDurationSeconds(), "/media/" + video.getThumbnailFile());
    }
}
