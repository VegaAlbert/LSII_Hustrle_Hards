package com.tecnocampus.LS2.protube_back.controller.dto;

import com.tecnocampus.LS2.protube_back.repository.VideoStatistics;

import java.time.Instant;

/**
 * Analytics of one of my videos (US-11). {@code thumbnailUrl} is a path under {@code /media}. {@code commentLikes} is
 * the sum of the likes of its comments.
 */
public record VideoAnalyticsResponse(Long id, String title, String thumbnailUrl, Instant publishedAt, long views,
                                     long authenticatedViews, long anonymousViews, long comments, long commentLikes) {

    public static VideoAnalyticsResponse from(VideoStatistics statistics) {
        return new VideoAnalyticsResponse(statistics.id(), statistics.title(), "/media/" + statistics.thumbnailFile(),
                statistics.publishedAt(), statistics.views(), statistics.authenticatedViews(),
                statistics.views() - statistics.authenticatedViews(), statistics.comments(),
                statistics.commentLikes());
    }
}
