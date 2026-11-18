package com.tecnocampus.LS2.protube_back.controller.dto;

import java.util.List;

/**
 * Analytics of the videos uploaded by the logged-in user (US-11): totals, one row per video (newest first) and the
 * views of the last days, oldest first. A user without videos gets zeros and empty lists, never an error.
 */
public record AnalyticsResponse(int totalVideos, long totalViews, long authenticatedViews, long anonymousViews,
                                long totalComments, long totalCommentLikes, List<VideoAnalyticsResponse> videos,
                                List<DailyViewsResponse> dailyViews) {
}
