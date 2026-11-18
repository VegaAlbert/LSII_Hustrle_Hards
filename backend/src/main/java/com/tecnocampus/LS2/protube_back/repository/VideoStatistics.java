package com.tecnocampus.LS2.protube_back.repository;

import java.time.Instant;

/**
 * Counters of one video, calculated by {@link VideoRepository#findStatisticsByUploader(String)} (US-11).
 * {@code commentLikes} is the sum of the likes of its comments: videos themselves have no likes yet.
 */
public record VideoStatistics(Long id, String title, String thumbnailFile, Instant publishedAt, long views,
                              long authenticatedViews, long comments, long commentLikes) {
}
