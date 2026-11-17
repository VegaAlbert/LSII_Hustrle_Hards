package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.CommentResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.UpdateVideoRequest;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoDetailResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.domain.Comment;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.domain.VideoCategory;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VideoServiceTest {

    @Mock
    VideoRepository videoRepository;

    @InjectMocks
    VideoService videoService;

    @Test
    void getVideosReturnsTheRequestedPageNewestFirst() {
        PageRequest request = PageRequest.of(1, 2, VideoService.NEWEST_FIRST);
        Video video = new Video("3", "Title", "Description", "Author", 90, 1280, 720,
                Instant.ofEpochSecond(1700000000), "3.mp4", "3.webp");
        when(videoRepository.findAll(request)).thenReturn(new PageImpl<>(List.of(video), request, 5));

        PageResponse<VideoSummaryResponse> response = videoService.getVideos(1, 2);

        assertEquals(1, response.page());
        assertEquals(2, response.size());
        assertEquals(5, response.totalElements());
        assertEquals(3, response.totalPages());
        assertEquals(List.of(new VideoSummaryResponse(null, "Title", "Author", 90, Instant.ofEpochSecond(1700000000),
                "/media/3.webp", "/media/3.mp4", false)), response.content());
    }

    @Test
    void getVideoReturnsTheDetailWithItsComments() {
        Video video = new Video("3", "Title", "Description", "Author", 90, 1280, 720,
                Instant.ofEpochSecond(1700000000), "3.mp4", "3.webp");
        video.addComment(new Comment("bob", "Nice", 2, Instant.ofEpochSecond(1700000001)));
        when(videoRepository.findById(7L)).thenReturn(Optional.of(video));

        VideoDetailResponse response = videoService.getVideo(7L);

        assertEquals("Title", response.title());
        assertEquals("Description", response.description());
        assertEquals("Author", response.author());
        assertEquals(90, response.durationSeconds());
        assertEquals(Instant.ofEpochSecond(1700000000), response.publishedAt());
        assertEquals("/media/3.mp4", response.videoUrl());
        assertEquals("/media/3.webp", response.thumbnailUrl());
        assertEquals(List.of(), response.tags());
        assertNull(response.category());
        assertFalse(response.ageRestricted());
        assertEquals(List.of(new CommentResponse(null, "bob", "Nice", 2, Instant.ofEpochSecond(1700000001))),
                response.comments());
    }

    @Test
    void getVideoThrowsWhenTheVideoDoesNotExist() {
        when(videoRepository.findById(99L)).thenReturn(Optional.empty());

        VideoNotFoundException e = assertThrows(VideoNotFoundException.class, () -> videoService.getVideo(99L));
        assertEquals("Video 99 not found", e.getMessage());
    }

    @Test
    void searchVideosSendsTrimmedPatternsToTheRepository() {
        PageRequest request = PageRequest.of(0, 12);
        Video video = new Video("3", "Title", "Description", "Author", 90, 1280, 720,
                Instant.ofEpochSecond(1700000000), "3.mp4", "3.webp");
        when(videoRepository.search("City Walls", "City Walls%", "%City Walls%", request))
                .thenReturn(new PageImpl<>(List.of(video), request, 1));

        PageResponse<VideoSummaryResponse> response = videoService.searchVideos("  City Walls ", 0, 12);

        assertEquals(1, response.totalElements());
        assertEquals("Title", response.content().get(0).title());
    }

    @Test
    void searchVideosEscapesLikeWildcards() {
        PageRequest request = PageRequest.of(0, 12);
        // The user types a%b_c\d; each wildcard (and the escape character itself) gets a \ in front
        String escaped = "a\\%b\\_c\\\\d";
        when(videoRepository.search(escaped, escaped + "%", "%" + escaped + "%", request))
                .thenReturn(Page.empty(request));

        PageResponse<VideoSummaryResponse> response = videoService.searchVideos("a%b_c\\d", 0, 12);

        assertEquals(0, response.totalElements());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void searchVideosWithABlankQueryReturnsTheWholeList(String query) {
        PageRequest request = PageRequest.of(0, 12, VideoService.NEWEST_FIRST);
        when(videoRepository.findAll(request)).thenReturn(Page.empty(request));

        videoService.searchVideos(query, 0, 12);

        verify(videoRepository).findAll(request);
        verify(videoRepository, never()).search(any(), any(), any(), any());
    }

    private static Video ownedBy(String username) {
        Video video = new Video("upload-1", "Old title", "Old description", username, 60, null, null,
                Instant.ofEpochSecond(1700000000), "upload-1.mp4", "upload-1-thumbnail.jpg");
        video.setUploader(new User(username, username + "@example.com", "hash"));
        video.setTags(List.of("old"));
        return video;
    }

    @Test
    void updateVideoReplacesTheMetadataOfTheOwnersVideo() {
        Video video = ownedBy("alice");
        when(videoRepository.findById(7L)).thenReturn(Optional.of(video));
        UpdateVideoRequest request = new UpdateVideoRequest("  New title ", " New #text ",
                List.of("#Beach", "beach", "sea"), VideoCategory.TRAVEL_AND_EVENTS, true);

        VideoDetailResponse response = videoService.updateVideo(7L, "alice", request);

        assertEquals("New title", video.getTitle());
        assertEquals("New #text", video.getDescription());
        assertEquals(List.of("Beach", "sea"), video.getTags());
        assertEquals(VideoCategory.TRAVEL_AND_EVENTS, video.getCategory());
        assertTrue(video.isAgeRestricted());
        assertEquals("New title", response.title());
        assertEquals("alice", response.uploader());
    }

    @Test
    void updateVideoClearsABlankDescription() {
        Video video = ownedBy("alice");
        when(videoRepository.findById(7L)).thenReturn(Optional.of(video));

        videoService.updateVideo(7L, "alice", new UpdateVideoRequest("Title", "  ", null, null, false));

        assertNull(video.getDescription());
        assertEquals(List.of(), video.getTags());
        assertNull(video.getCategory());
    }

    @Test
    void updateVideoDeniesOtherUsers() {
        Video video = ownedBy("alice");
        when(videoRepository.findById(7L)).thenReturn(Optional.of(video));

        assertThrows(VideoAccessDeniedException.class, () -> videoService.updateVideo(7L, "bob",
                new UpdateVideoRequest("Hacked", null, null, null, false)));
        assertEquals("Old title", video.getTitle());
    }

    @Test
    void updateVideoDeniesImportedVideosWithoutOwner() {
        Video imported = new Video("3", "Title", null, "Author", 90, null, null, Instant.ofEpochSecond(1700000000),
                "3.mp4", "3.webp");
        when(videoRepository.findById(3L)).thenReturn(Optional.of(imported));

        assertThrows(VideoAccessDeniedException.class, () -> videoService.updateVideo(3L, "alice",
                new UpdateVideoRequest("Title", null, null, null, false)));
    }

    @Test
    void updateVideoThrowsWhenTheVideoDoesNotExist() {
        when(videoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(VideoNotFoundException.class, () -> videoService.updateVideo(99L, "alice",
                new UpdateVideoRequest("Title", null, null, null, false)));
    }
}
