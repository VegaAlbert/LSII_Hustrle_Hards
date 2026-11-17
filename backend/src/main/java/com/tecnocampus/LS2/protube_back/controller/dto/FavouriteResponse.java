package com.tecnocampus.LS2.protube_back.controller.dto;

/**
 * US-12: whether a video is a favourite of the logged-in user.
 */
public record FavouriteResponse(Long videoId, boolean favourite) {
}
