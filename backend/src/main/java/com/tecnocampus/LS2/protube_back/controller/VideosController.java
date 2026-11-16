package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.controller.dto.CommentResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.CreateCommentRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.UploadVideoRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoDetailResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.services.CommentService;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import com.tecnocampus.LS2.protube_back.services.VideoUploadService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;

@RestController
@RequestMapping("/api/videos")
public class VideosController {

    private final VideoService videoService;
    private final VideoUploadService videoUploadService;
    private final CommentService commentService;

    public VideosController(VideoService videoService, VideoUploadService videoUploadService,
                            CommentService commentService) {
        this.videoService = videoService;
        this.videoUploadService = videoUploadService;
        this.commentService = commentService;
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

    /**
     * US-06: publishes a video as the logged-in user. Multipart request with the parts {@code metadata} (JSON),
     * {@code video} and {@code thumbnail}. Answers 201 with the new video, 400 for invalid data or files, 401 without
     * a valid token and 413 if the files are too big.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VideoDetailResponse> uploadVideo(@Valid @RequestPart("metadata") UploadVideoRequest metadata,
                                                           @RequestPart("video") MultipartFile video,
                                                           @RequestPart("thumbnail") MultipartFile thumbnail,
                                                           Authentication authentication) {
        VideoDetailResponse created = videoUploadService.upload(authentication.getName(), metadata, video, thumbnail);
        return ResponseEntity.created(URI.create("/api/videos/" + created.id())).body(created);
    }

    /**
     * US-09: comments on a video as the logged-in user. Answers 201 with the new comment, 400 for a blank or too long
     * text, 401 without a valid token and 404 if the video does not exist.
     */
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(@PathVariable Long id,
                                                      @Valid @RequestBody CreateCommentRequest request,
                                                      Authentication authentication) {
        CommentResponse created = commentService.addComment(id, authentication.getName(), request.text());
        // No Location header: comments have no route of their own, they are read with GET /api/videos/{id}
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
