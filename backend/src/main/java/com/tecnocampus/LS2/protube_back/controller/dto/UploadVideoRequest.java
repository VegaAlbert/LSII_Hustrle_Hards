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
        @NotBlank(message = "{validation.title.required}")
        @Size(max = 100, message = "{validation.title.size}") String title,
        @Size(max = 5000, message = "{validation.description.size}") String description,
        @Size(max = 15, message = "{validation.tags.size}")
        List<@Size(max = 30, message = "{validation.tag.size}") String> tags,
        VideoCategory category,
        boolean ageRestricted,
        @Min(value = 0, message = "{validation.duration.min}") int durationSeconds,
        @Min(value = 1, message = "{validation.width.min}") @Max(value = 7680, message = "{validation.width.max}")
        Integer width,
        @Min(value = 1, message = "{validation.height.min}") @Max(value = 4320, message = "{validation.height.max}")
        Integer height) {
}
