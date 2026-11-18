package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.SubscriberCountResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.SubscriptionResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.services.SubscriptionService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * US-13: subscriptions to the channels of other users. A channel is the username of its owner. Only reading the state
 * of a channel is public; every other route answers 401 without a valid token (see SecurityConfig).
 */
@RestController
public class SubscriptionsController {

    private final SubscriptionService subscriptionService;

    public SubscriptionsController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    /**
     * Number of subscribers of the channel and, with a valid token, whether the user is subscribed. Answers 404 if the
     * channel does not exist.
     */
    @GetMapping("/api/channels/{channel}/subscription")
    public ResponseEntity<SubscriptionResponse> getSubscription(@PathVariable String channel,
                                                                Authentication authentication) {
        // Null for anonymous visitors
        String viewer = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(subscriptionService.getSubscription(viewer, channel));
    }

    /**
     * Subscribes to the channel (idempotent). Answers 400 for the channel of the user and 404 if it does not exist.
     */
    @PutMapping("/api/channels/{channel}/subscription")
    public ResponseEntity<SubscriptionResponse> subscribe(@PathVariable String channel,
                                                          Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.subscribe(authentication.getName(), channel));
    }

    /**
     * Unsubscribes from the channel (idempotent). Answers 404 if the channel does not exist.
     */
    @DeleteMapping("/api/channels/{channel}/subscription")
    public ResponseEntity<SubscriptionResponse> unsubscribe(@PathVariable String channel,
                                                            Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.unsubscribe(authentication.getName(), channel));
    }

    /**
     * Paginated videos of the channels the user is subscribed to, newest first. Invalid {@code page} or {@code size}
     * answer 400.
     */
    @GetMapping("/api/subscriptions/videos")
    public ResponseEntity<PageResponse<VideoSummaryResponse>> getSubscriptionVideos(
            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "{validation.page.min}") int page,
            @RequestParam(defaultValue = "12")
            @Min(value = 1, message = "{validation.size.range}")
            @Max(value = 50, message = "{validation.size.range}") int size,
            Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionVideos(authentication.getName(), page, size));
    }

    /**
     * Number of users subscribed to the channel of the logged-in user, for their analytics.
     */
    @GetMapping("/api/subscriptions/subscribers")
    public ResponseEntity<SubscriberCountResponse> countSubscribers(Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.countSubscribers(authentication.getName()));
    }
}
