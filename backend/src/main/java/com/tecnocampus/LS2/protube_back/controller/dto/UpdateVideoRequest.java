package com.tecnocampus.LS2.protube_back.controller.dto;

import com.tecnocampus.LS2.protube_back.domain.VideoCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Body of {@code PUT /api/videos/{id}} (US-07): the editable metadata of a video, with the same rules as when it is
 * uploaded (see UploadVideoRequest). Every field is replaced, so the frontend sends the whole form.
 */
public record UpdateVideoRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 100, message = "Title must be at most 100 characters") String title,
        @Size(max = 5000, message = "Description must be at most 5000 characters") String description,
        @Size(max = 15, message = "At most 15 tags")
        List<@Size(max = 30, message = "Each tag must be at most 30 characters") String> tags,
        VideoCategory category,
        boolean ageRestricted) {
}
