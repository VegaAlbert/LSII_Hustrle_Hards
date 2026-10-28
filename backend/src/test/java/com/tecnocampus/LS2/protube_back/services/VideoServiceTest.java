package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.CommentResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoDetailResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.domain.Comment;
import com.tecnocampus.LS2.protube_back.domain.Video;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
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
        assertEquals(List.of(new VideoSummaryResponse(null, "Title", "Author", 90, "/media/3.webp")),
                response.content());
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
}
