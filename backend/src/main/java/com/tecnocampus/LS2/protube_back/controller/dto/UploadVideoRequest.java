package com.tecnocampus.LS2.protube_back.controller.dto;

import com.tecnocampus.LS2.protube_back.domain.VideoCategory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Metadata sent as the {@code metadata} JSON part of {@code POST /api/videos} (US-06), next to the video and thumbnail
 * files. Duration and size are read by the browser from the file; tags may come with a leading {@code #}.
 */
public record UploadVideoRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 100, message = "Title must be at most 100 characters") String title,
        @Size(max = 5000, message = "Description must be at most 5000 characters") String description,
        @Size(max = 15, message = "At most 15 tags")
        List<@Size(max = 30, message = "Each tag must be at most 30 characters") String> tags,
        VideoCategory category,
        boolean ageRestricted,
        @Min(value = 0, message = "Duration must be 0 or greater") int durationSeconds,
        @Min(value = 1, message = "Width must be positive") @Max(value = 7680, message = "Width is too large")
        Integer width,
        @Min(value = 1, message = "Height must be positive") @Max(value = 4320, message = "Height is too large")
        Integer height) {
}
