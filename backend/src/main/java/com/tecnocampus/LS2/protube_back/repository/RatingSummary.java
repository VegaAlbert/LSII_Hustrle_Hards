package com.tecnocampus.LS2.protube_back.repository;

/**
 * Average score and number of ratings of one video, calculated by the database. {@code average} is null when the
 * video has no ratings.
 */
public record RatingSummary(Double average, long count) {
}
