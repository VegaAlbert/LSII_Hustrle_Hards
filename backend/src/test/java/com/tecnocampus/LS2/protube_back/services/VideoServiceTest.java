package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.CommentResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoDetailResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.domain.Comment;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.CommentLikeRepository;
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
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VideoServiceTest {

    @Mock
    VideoRepository videoRepository;

    @Mock
    CommentLikeRepository commentLikeRepository;

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

        VideoDetailResponse response = videoService.getVideo(7L, null);

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
        assertEquals(List.of(new CommentResponse(null, "bob", "Nice", 2, Instant.ofEpochSecond(1700000001), false,
                List.of())), response.comments());
        // An anonymous visitor likes nothing, so the likes are not even read
        verify(commentLikeRepository, never()).findLikedCommentIds(anyLong(), anyString());
    }

    @Test
    void getVideoNestsTheRepliesUnderTheirComment() {
        Video video = new Video("3", "Title", null, "Author", 90, null, null,
                Instant.ofEpochSecond(1700000000), "3.mp4", "3.webp");
        Comment comment = new Comment("bob", "Nice", 0, Instant.ofEpochSecond(1700000001));
        Comment reply = new Comment("alice", "Agree", 0, Instant.ofEpochSecond(1700000002));
        video.addComment(comment);
        video.addComment(reply);
        comment.addReply(reply);
        when(videoRepository.findById(7L)).thenReturn(Optional.of(video));

        VideoDetailResponse response = videoService.getVideo(7L, null);

        assertEquals(1, response.comments().size());
        CommentResponse top = response.comments().get(0);
        assertEquals("Nice", top.text());
        assertEquals(1, top.replies().size());
        assertEquals("Agree", top.replies().get(0).text());
        assertEquals(List.of(), top.replies().get(0).replies());
    }

    @Test
    void getVideoMarksTheCommentsTheViewerLikes() {
        Video video = new Video("3", "Title", null, "Author", 90, null, null,
                Instant.ofEpochSecond(1700000000), "3.mp4", "3.webp");
        video.addComment(new Comment("bob", "Nice", 1, Instant.ofEpochSecond(1700000001)));
        when(videoRepository.findById(7L)).thenReturn(Optional.of(video));
        // The comment was never saved, so its id is null
        when(commentLikeRepository.findLikedCommentIds(7L, "alice")).thenReturn(Set.of());

        VideoDetailResponse response = videoService.getVideo(7L, "alice");

        verify(commentLikeRepository).findLikedCommentIds(7L, "alice");
        assertFalse(response.comments().get(0).likedByMe());
    }

    @Test
    void getVideoThrowsWhenTheVideoDoesNotExist() {
        when(videoRepository.findById(99L)).thenReturn(Optional.empty());

        VideoNotFoundException e = assertThrows(VideoNotFoundException.class, () -> videoService.getVideo(99L, null));
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
