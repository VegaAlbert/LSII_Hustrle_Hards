package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.controller.dto.AnalyticsResponse;
import com.tecnocampus.LS2.protube_back.services.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * US-11: analytics of the videos of the logged-in user. It takes no user id on purpose: the user always comes
     * from the token, so nobody can ask for the analytics of someone else. Answers 200 (with zeros and empty lists
     * for a user without videos) and 401 without a valid token.
     */
    @GetMapping
    public ResponseEntity<AnalyticsResponse> getMyAnalytics(Authentication authentication) {
        return ResponseEntity.ok(analyticsService.getAnalytics(authentication.getName()));
    }
}
