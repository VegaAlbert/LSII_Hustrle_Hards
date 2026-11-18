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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * US-13: subscriptions to channels. A channel is the author of videos and travels as the {@code name} query parameter,
 * because author names may hold spaces or slashes ("AC/DC") that do not fit in a path segment. Only reading the state
 * of a channel is public; every other route answers 401 without a valid token (see SecurityConfig).
 */
@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionsController {

    private final SubscriptionService subscriptionService;

    public SubscriptionsController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    /**
     * Number of subscribers of the channel and, with a valid token, whether the user is subscribed. Answers 404 if the
     * channel does not exist.
     */
    @GetMapping("/channel")
    public ResponseEntity<SubscriptionResponse> getSubscription(@RequestParam String name,
                                                                Authentication authentication) {
        // Null for anonymous visitors
        String viewer = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(subscriptionService.getSubscription(viewer, name));
    }

    /**
     * Subscribes to the channel (idempotent). Answers 400 for the channel of the user and 404 if it does not exist.
     */
    @PutMapping("/channel")
    public ResponseEntity<SubscriptionResponse> subscribe(@RequestParam String name, Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.subscribe(authentication.getName(), name));
    }

    /**
     * Unsubscribes from the channel (idempotent). Answers 404 if the channel does not exist.
     */
    @DeleteMapping("/channel")
    public ResponseEntity<SubscriptionResponse> unsubscribe(@RequestParam String name,
                                                            Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.unsubscribe(authentication.getName(), name));
    }

    /**
     * Paginated videos of the channels the user is subscribed to, newest first. Invalid {@code page} or {@code size}
     * answer 400.
     */
    @GetMapping("/videos")
    public ResponseEntity<PageResponse<VideoSummaryResponse>> getSubscriptionVideos(
            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "Page must be 0 or greater") int page,
            @RequestParam(defaultValue = "12")
            @Min(value = 1, message = "Size must be between 1 and 50")
            @Max(value = 50, message = "Size must be between 1 and 50") int size,
            Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionVideos(authentication.getName(), page, size));
    }

    /**
     * Number of users subscribed to the channel of the logged-in user, for their analytics.
     */
    @GetMapping("/subscribers")
    public ResponseEntity<SubscriberCountResponse> countSubscribers(Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.countSubscribers(authentication.getName()));
    }
}
