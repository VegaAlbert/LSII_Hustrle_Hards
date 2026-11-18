package com.tecnocampus.LS2.protube_back.controller.dto;

/**
 * US-13: number of users subscribed to the channel of the logged-in user, shown in their analytics.
 */
public record SubscriberCountResponse(long subscribers) {
}
