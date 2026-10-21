package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/videos")
public class VideosController {

    private final VideoService videoService;

    public VideosController(VideoService videoService) {
        this.videoService = videoService;
    }

    /**
     * US-04: public, paginated video list. Invalid {@code page} or {@code size} answer 400 (see ApiExceptionHandler).
     */
    @GetMapping
    public ResponseEntity<PageResponse<VideoSummaryResponse>> getVideos(
            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "Page must be 0 or greater") int page,
            @RequestParam(defaultValue = "12")
            @Min(value = 1, message = "Size must be between 1 and 50")
            @Max(value = 50, message = "Size must be between 1 and 50") int size) {
        return ResponseEntity.ok(videoService.getVideos(page, size));
    }
}
