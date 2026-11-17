package com.tecnocampus.LS2.protube_back.controller.dto;

/**
 * Ratings of a video: the average score rounded to one decimal (null when nobody has rated it yet, so no fake
 * average is shown), the number of ratings and the score of the logged-in user (null for anonymous visitors or if they
 * have not rated it).
 */
public record VideoRatingResponse(Double average, long count, Integer myScore) {
}
