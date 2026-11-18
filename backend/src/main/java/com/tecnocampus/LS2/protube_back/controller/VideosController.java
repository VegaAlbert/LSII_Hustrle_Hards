package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.controller.dto.CommentLikeResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.CommentResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.CreateCommentRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.RateVideoRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.UpdateVideoRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.UploadVideoRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoDetailResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoRatingResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.services.AnalyticsService;
import com.tecnocampus.LS2.protube_back.services.CommentService;
import com.tecnocampus.LS2.protube_back.services.RatingService;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
    private final RatingService ratingService;
    private final AnalyticsService analyticsService;

    public VideosController(VideoService videoService, VideoUploadService videoUploadService,
                            CommentService commentService, RatingService ratingService,
                            AnalyticsService analyticsService) {
        this.videoService = videoService;
        this.videoUploadService = videoUploadService;
        this.commentService = commentService;
        this.ratingService = ratingService;
        this.analyticsService = analyticsService;
    }

    /**
     * US-04: public, paginated video list. US-08: with a non-blank {@code q}, only the matching videos, most relevant
     * first. Invalid {@code q}, {@code page} or {@code size} answer 400 (see ApiExceptionHandler).
     */
    @GetMapping
    public ResponseEntity<PageResponse<VideoSummaryResponse>> getVideos(
            @RequestParam(required = false)
            @Size(max = 100, message = "{validation.search.size}") String q,
            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "{validation.page.min}") int page,
            @RequestParam(defaultValue = "12")
            @Min(value = 1, message = "{validation.size.range}")
            @Max(value = 50, message = "{validation.size.range}") int size) {
        return ResponseEntity.ok(videoService.searchVideos(q, page, size));
    }

    /**
     * US-05: public detail of one video with its comments. Answers 404 if the id does not exist.
     * US-10: if a valid token is sent, the comments the user likes have {@code likedByMe} set.
     */
    @GetMapping("/{id}")
    public ResponseEntity<VideoDetailResponse> getVideo(@PathVariable Long id, Authentication authentication) {
        // Null for anonymous visitors
        String viewer = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(videoService.getVideo(id, viewer));
    }

    /**
     * US-07: edits the metadata of a video owned by the logged-in user. Answers 200 with the updated video, 400 for
     * invalid data, 401 without a valid token, 403 if the video belongs to someone else and 404 if it does not exist.
     */
    @PutMapping("/{id}")
    public ResponseEntity<VideoDetailResponse> updateVideo(@PathVariable Long id,
                                                           @Valid @RequestBody UpdateVideoRequest request,
                                                           Authentication authentication) {
        return ResponseEntity.ok(videoService.updateVideo(id, authentication.getName(), request));
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

    /**
     * Video ratings: public average and number of ratings of a video, plus the score of the logged-in user when the
     * request has a valid token. Answers 404 if the video does not exist.
     */
    @GetMapping("/{id}/rating")
    public ResponseEntity<VideoRatingResponse> getRating(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(ratingService.getRating(id, authentication == null ? null : authentication.getName()));
    }

    /**
     * Video ratings: rates a video from 1 to 5 stars as the logged-in user, or changes their previous rating. The user
     * comes from the token, never from the body. Answers 200 with the new average, 400 for a missing, out of range or
     * non-whole score, 401 without a valid token, 404 if the video does not exist and 409 if the same user rated the
     * same video at the same time from somewhere else.
     */
    @PutMapping("/{id}/rating")
    public ResponseEntity<VideoRatingResponse> rateVideo(@PathVariable Long id,
                                                         @Valid @RequestBody RateVideoRequest request,
                                                         Authentication authentication) {
        return ResponseEntity.ok(ratingService.rate(id, authentication.getName(), request.score().intValueExact()));
    }

    /**
     * US-11: counts a view of a video, sent by the detail page when it is opened. Public: a visitor without a token
     * counts as an anonymous view, a logged-in one as an authenticated view. Answers 204, or 404 if the video does not
     * exist. GET /api/videos/{id} does not count views because the edit page also reads the video with it.
     */
    @PostMapping("/{id}/views")
    public ResponseEntity<Void> recordView(@PathVariable Long id, Authentication authentication) {
        analyticsService.recordView(id, authentication == null ? null : authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * US-10: replies to a comment of the video as the logged-in user. Answers 201 with the new reply, 400 for a blank
     * or too long text, 401 without a valid token and 404 if the video or the comment does not exist.
     */
    @PostMapping("/{videoId}/comments/{commentId}/replies")
    public ResponseEntity<CommentResponse> addReply(@PathVariable Long videoId, @PathVariable Long commentId,
                                                    @Valid @RequestBody CreateCommentRequest request,
                                                    Authentication authentication) {
        CommentResponse created = commentService.addReply(videoId, commentId, authentication.getName(),
                request.text());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * US-10: the logged-in user likes a comment (idempotent). Answers 200 with the new count, 401 without a valid
     * token and 404 if the video or the comment does not exist.
     */
    @PutMapping("/{videoId}/comments/{commentId}/like")
    public ResponseEntity<CommentLikeResponse> likeComment(@PathVariable Long videoId, @PathVariable Long commentId,
                                                           Authentication authentication) {
        return ResponseEntity.ok(commentService.likeComment(videoId, commentId, authentication.getName()));
    }

    /**
     * US-10: the logged-in user stops liking a comment (idempotent). Same answers as {@link #likeComment}.
     */
    @DeleteMapping("/{videoId}/comments/{commentId}/like")
    public ResponseEntity<CommentLikeResponse> unlikeComment(@PathVariable Long videoId, @PathVariable Long commentId,
                                                             Authentication authentication) {
        return ResponseEntity.ok(commentService.unlikeComment(videoId, commentId, authentication.getName()));
    }
}
