package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.AnalyticsResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.DailyViewsResponse;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.domain.VideoView;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoStatistics;
import com.tecnocampus.LS2.protube_back.repository.VideoViewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-17T10:00:00Z");

    @Mock
    VideoRepository videoRepository;

    @Mock
    VideoViewRepository videoViewRepository;

    @Mock
    UserRepository userRepository;

    AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        analyticsService = new AnalyticsService(videoRepository, videoViewRepository, userRepository,
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private static Video video() {
        return new Video("upload-1", "Summer in Girona", null, "alice", 60, null, null,
                Instant.parse("2026-11-01T10:00:00Z"), "upload-1.mp4", "upload-1-thumbnail.jpg");
    }

    @Test
    void addsUpTheCountersOfEveryVideoOfTheUser() {
        when(userRepository.existsByUsername("alice")).thenReturn(true);
        when(videoRepository.findStatisticsByUploader("alice")).thenReturn(List.of(
                new VideoStatistics(2L, "Second", "2.jpg", Instant.parse("2026-11-10T10:00:00Z"), 5, 2, 3, 7),
                new VideoStatistics(1L, "First", "1.jpg", Instant.parse("2026-11-01T10:00:00Z"), 1, 0, 0, 0)));
        when(videoViewRepository.findViewDatesOfUploaderSince(anyString(), any())).thenReturn(List.of());

        AnalyticsResponse analytics = analyticsService.getAnalytics("alice");

        assertEquals(2, analytics.totalVideos());
        assertEquals(6, analytics.totalViews());
        assertEquals(2, analytics.authenticatedViews());
        assertEquals(4, analytics.anonymousViews());
        assertEquals(3, analytics.totalComments());
        assertEquals(7, analytics.totalCommentLikes());
        assertEquals("Second", analytics.videos().get(0).title());
        assertEquals("/media/2.jpg", analytics.videos().get(0).thumbnailUrl());
        assertEquals(3, analytics.videos().get(0).anonymousViews());
    }

    @Test
    void groupsTheViewsOfTheLast30DaysByDayFillingTheDaysWithoutViews() {
        when(userRepository.existsByUsername("alice")).thenReturn(true);
        when(videoRepository.findStatisticsByUploader("alice")).thenReturn(List.of(
                new VideoStatistics(1L, "First", "1.jpg", NOW, 3, 0, 0, 0)));
        Instant firstDay = Instant.parse("2026-10-19T00:00:00Z");
        when(videoViewRepository.findViewDatesOfUploaderSince("alice", firstDay)).thenReturn(List.of(
                Instant.parse("2026-10-19T00:00:00Z"),
                Instant.parse("2026-11-17T08:00:00Z"),
                Instant.parse("2026-11-17T09:30:00Z")));

        List<DailyViewsResponse> days = analyticsService.getAnalytics("alice").dailyViews();

        assertEquals(30, days.size());
        assertEquals(new DailyViewsResponse(LocalDate.parse("2026-10-19"), 1), days.get(0));
        assertEquals(new DailyViewsResponse(LocalDate.parse("2026-10-20"), 0), days.get(1));
        assertEquals(new DailyViewsResponse(LocalDate.parse("2026-11-17"), 2), days.get(29));
    }

    @Test
    void returnsAnEmptyAnalyticsForAUserWithoutVideos() {
        when(userRepository.existsByUsername("bob")).thenReturn(true);
        when(videoRepository.findStatisticsByUploader("bob")).thenReturn(List.of());

        AnalyticsResponse analytics = analyticsService.getAnalytics("bob");

        assertEquals(0, analytics.totalVideos());
        assertEquals(0, analytics.totalViews());
        assertTrue(analytics.videos().isEmpty());
        assertTrue(analytics.dailyViews().isEmpty());
        verify(videoViewRepository, never()).findViewDatesOfUploaderSince(anyString(), any());
    }

    @Test
    void rejectsATokenOfAUserThatNoLongerExists() {
        when(userRepository.existsByUsername("ghost")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> analyticsService.getAnalytics("ghost"));
        verify(videoRepository, never()).findStatisticsByUploader(anyString());
    }

    @Test
    void recordsAViewOfALoggedInUserDatedNow() {
        Video video = video();
        User alice = new User("alice", "alice@example.com", "hash");
        when(videoRepository.findById(1L)).thenReturn(Optional.of(video));
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));

        analyticsService.recordView(1L, "alice");

        ArgumentCaptor<VideoView> saved = ArgumentCaptor.forClass(VideoView.class);
        verify(videoViewRepository).save(saved.capture());
        assertSame(video, saved.getValue().getVideo());
        assertSame(alice, saved.getValue().getViewer());
        assertEquals(NOW, saved.getValue().getViewedAt());
    }

    @Test
    void recordsAnAnonymousViewWithoutAViewer() {
        when(videoRepository.findById(1L)).thenReturn(Optional.of(video()));

        analyticsService.recordView(1L, null);

        ArgumentCaptor<VideoView> saved = ArgumentCaptor.forClass(VideoView.class);
        verify(videoViewRepository).save(saved.capture());
        assertNull(saved.getValue().getViewer());
        verify(userRepository, never()).findByUsername(anyString());
    }

    @Test
    void countsTheViewOfAUserThatNoLongerExistsAsAnonymous() {
        when(videoRepository.findById(1L)).thenReturn(Optional.of(video()));
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        analyticsService.recordView(1L, "ghost");

        ArgumentCaptor<VideoView> saved = ArgumentCaptor.forClass(VideoView.class);
        verify(videoViewRepository).save(saved.capture());
        assertNull(saved.getValue().getViewer());
    }

    @Test
    void doesNotRecordViewsOfVideosThatDoNotExist() {
        when(videoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(VideoNotFoundException.class, () -> analyticsService.recordView(99L, null));
        verify(videoViewRepository, never()).save(any());
    }
}
