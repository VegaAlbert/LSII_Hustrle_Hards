package com.tecnocampus.LS2.protube_back.controller.dto;

/**
 * US-13: a channel (the author of videos), whether the logged-in user is subscribed to it (always false for an
 * anonymous visitor) and how many subscribers it has.
 */
public record SubscriptionResponse(String channel, boolean subscribed, long subscribers) {
}
