package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.VideoRatingResponse;
import com.tecnocampus.LS2.protube_back.domain.Rating;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.RatingRepository;
import com.tecnocampus.LS2.protube_back.repository.RatingSummary;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RatingServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-17T10:00:00Z");

    @Mock
    RatingRepository ratingRepository;

    @Mock
    VideoRepository videoRepository;

    @Mock
    UserRepository userRepository;

    RatingService ratingService;

    final Video video = new Video("abc", "Uptown Funk", null, "Mark Ronson", 79, null, null,
            Instant.parse("2014-11-19T13:20:18Z"), "0.mp4", "0.webp");
    final User alice = new User("alice", "alice@example.com", "hash");

    @BeforeEach
    void setUp() {
        ratingService = new RatingService(ratingRepository, videoRepository, userRepository,
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void createsTheFirstRatingOfTheUserDatedNow() {
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video));
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
        Rating saved = new Rating(alice, video, 4, NOW);
        when(ratingRepository.findByVideoIdAndUserUsername(5L, "alice"))
                .thenReturn(Optional.empty(), Optional.of(saved));
        when(ratingRepository.summarize(5L)).thenReturn(new RatingSummary(4.0, 1));

        VideoRatingResponse response = ratingService.rate(5L, "alice", 4);

        ArgumentCaptor<Rating> created = ArgumentCaptor.forClass(Rating.class);
        verify(ratingRepository).saveAndFlush(created.capture());
        assertSame(alice, created.getValue().getUser());
        assertSame(video, created.getValue().getVideo());
        assertEquals(4, created.getValue().getScore());
        assertEquals(NOW, created.getValue().getRatedAt());
        assertEquals(new VideoRatingResponse(4.0, 1, 4), response);
    }

    @Test
    void changesThePreviousRatingInsteadOfCreatingAnotherOne() {
        Rating previous = new Rating(alice, video, 2, Instant.parse("2026-11-01T10:00:00Z"));
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video));
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
        when(ratingRepository.findByVideoIdAndUserUsername(5L, "alice")).thenReturn(Optional.of(previous));
        when(ratingRepository.summarize(5L)).thenReturn(new RatingSummary(5.0, 1));

        VideoRatingResponse response = ratingService.rate(5L, "alice", 5);

        assertEquals(5, previous.getScore());
        assertEquals(NOW, previous.getRatedAt());
        verify(ratingRepository, never()).saveAndFlush(any());
        assertEquals(new VideoRatingResponse(5.0, 1, 5), response);
    }

    @Test
    void reportsAConflictWhenTheSameRatingIsCreatedTwiceAtTheSameTime() {
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video));
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
        when(ratingRepository.findByVideoIdAndUserUsername(5L, "alice")).thenReturn(Optional.empty());
        when(ratingRepository.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("duplicate"));

        assertThrows(RatingConflictException.class, () -> ratingService.rate(5L, "alice", 3));
    }

    @Test
    void doesNotRateVideosThatDoNotExist() {
        when(videoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(VideoNotFoundException.class, () -> ratingService.rate(99L, "alice", 3));
        verify(ratingRepository, never()).saveAndFlush(any());
    }

    @Test
    void rejectsATokenOfAUserThatNoLongerExists() {
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video));
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> ratingService.rate(5L, "ghost", 3));
        verify(ratingRepository, never()).saveAndFlush(any());
    }

    @Test
    void theEntityRejectsScoresOutOfRange() {
        assertThrows(IllegalArgumentException.class, () -> new Rating(alice, video, 0, NOW));
        assertThrows(IllegalArgumentException.class, () -> new Rating(alice, video, 6, NOW));
    }

    @Test
    void anonymousVisitorsGetTheAverageWithoutAScoreOfTheirOwn() {
        when(videoRepository.existsById(5L)).thenReturn(true);
        when(ratingRepository.summarize(5L)).thenReturn(new RatingSummary(4.4666, 3));

        VideoRatingResponse response = ratingService.getRating(5L, null);

        assertEquals(new VideoRatingResponse(4.5, 3, null), response);
        verify(ratingRepository, never()).findByVideoIdAndUserUsername(any(), anyString());
    }

    @Test
    void aVideoWithoutRatingsHasNoAverage() {
        when(videoRepository.existsById(5L)).thenReturn(true);
        when(ratingRepository.summarize(5L)).thenReturn(new RatingSummary(null, 0));
        when(ratingRepository.findByVideoIdAndUserUsername(5L, "alice")).thenReturn(Optional.empty());

        VideoRatingResponse response = ratingService.getRating(5L, "alice");

        assertNull(response.average());
        assertEquals(0, response.count());
        assertNull(response.myScore());
    }

    @Test
    void theRatingOfAVideoThatDoesNotExistIsNotFound() {
        when(videoRepository.existsById(99L)).thenReturn(false);

        assertThrows(VideoNotFoundException.class, () -> ratingService.getRating(99L, null));
    }
}
