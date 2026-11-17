package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.controller.dto.FavouriteResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.services.FavouriteService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * US-12: favourite videos of the logged-in user. Every route answers 401 without a valid token (see SecurityConfig).
 */
@RestController
@RequestMapping("/api/favourites")
public class FavouritesController {

    private final FavouriteService favouriteService;

    public FavouritesController(FavouriteService favouriteService) {
        this.favouriteService = favouriteService;
    }

    /**
     * Paginated favourite videos, last saved first. Invalid {@code page} or {@code size} answer 400.
     */
    @GetMapping
    public ResponseEntity<PageResponse<VideoSummaryResponse>> getFavourites(
            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "Page must be 0 or greater") int page,
            @RequestParam(defaultValue = "12")
            @Min(value = 1, message = "Size must be between 1 and 50")
            @Max(value = 50, message = "Size must be between 1 and 50") int size,
            Authentication authentication) {
        return ResponseEntity.ok(favouriteService.getFavourites(authentication.getName(), page, size));
    }

    /**
     * Whether the video is a favourite. Answers 404 if the video does not exist.
     */
    @GetMapping("/{videoId}")
    public ResponseEntity<FavouriteResponse> getFavourite(@PathVariable Long videoId, Authentication authentication) {
        return ResponseEntity.ok(favouriteService.isFavourite(authentication.getName(), videoId));
    }

    /**
     * Saves the video as favourite (idempotent). Answers 404 if the video does not exist.
     */
    @PutMapping("/{videoId}")
    public ResponseEntity<FavouriteResponse> addFavourite(@PathVariable Long videoId, Authentication authentication) {
        return ResponseEntity.ok(favouriteService.addFavourite(authentication.getName(), videoId));
    }

    /**
     * Removes the video from the favourites (idempotent). Answers 404 if the video does not exist.
     */
    @DeleteMapping("/{videoId}")
    public ResponseEntity<FavouriteResponse> removeFavourite(@PathVariable Long videoId,
                                                             Authentication authentication) {
        return ResponseEntity.ok(favouriteService.removeFavourite(authentication.getName(), videoId));
    }
}
