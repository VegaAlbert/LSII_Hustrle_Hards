package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoDetailResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
     * US-04: public, paginated video list. US-08: with a non-blank {@code q}, only the matching videos, most relevant
     * first. Invalid {@code q}, {@code page} or {@code size} answer 400 (see ApiExceptionHandler).
     */
    @GetMapping
    public ResponseEntity<PageResponse<VideoSummaryResponse>> getVideos(
            @RequestParam(required = false)
            @Size(max = 100, message = "Search text must be at most 100 characters") String q,
            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "Page must be 0 or greater") int page,
            @RequestParam(defaultValue = "12")
            @Min(value = 1, message = "Size must be between 1 and 50")
            @Max(value = 50, message = "Size must be between 1 and 50") int size) {
        return ResponseEntity.ok(videoService.searchVideos(q, page, size));
    }

    /**
     * US-05: public detail of one video with its comments. Answers 404 if the id does not exist.
     */
    @GetMapping("/{id}")
    public ResponseEntity<VideoDetailResponse> getVideo(@PathVariable Long id) {
        return ResponseEntity.ok(videoService.getVideo(id));
    }
}
