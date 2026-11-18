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
        @NotBlank(message = "{validation.title.required}")
        @Size(max = 100, message = "{validation.title.size}") String title,
        @Size(max = 5000, message = "{validation.description.size}") String description,
        @Size(max = 15, message = "{validation.tags.size}")
        List<@Size(max = 30, message = "{validation.tag.size}") String> tags,
        VideoCategory category,
        boolean ageRestricted) {
}
