package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.FavouriteResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.domain.Favourite;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.FavouriteRepository;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FavouriteServiceTest {

    @Mock
    FavouriteRepository favouriteRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    VideoRepository videoRepository;

    @InjectMocks
    FavouriteService favouriteService;

    // Not saved, so its id is null; the repositories are mocked
    private final User alice = new User("alice", "alice@example.com", "hash");

    private static Video video(String title) {
        return new Video("abc", title, null, "Mark Ronson", 79, null, null,
                Instant.parse("2014-11-19T13:20:18Z"), "0.mp4", "0.webp");
    }

    private void givenTheVideoAndAlice(Video video) {
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video));
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
    }

    @Test
    void addFavouriteSavesTheVideoForTheUserDatedNow() {
        Video video = video("Uptown Funk");
        givenTheVideoAndAlice(video);
        when(favouriteRepository.existsByUserIdAndVideoId(alice.getId(), 5L)).thenReturn(false);
        Instant before = Instant.now();

        FavouriteResponse response = favouriteService.addFavourite("alice", 5L);

        ArgumentCaptor<Favourite> saved = ArgumentCaptor.forClass(Favourite.class);
        verify(favouriteRepository).save(saved.capture());
        assertSame(alice, saved.getValue().getUser());
        assertSame(video, saved.getValue().getVideo());
        assertFalse(saved.getValue().getSavedAt().isBefore(before));
        assertEquals(new FavouriteResponse(5L, true), response);
    }

    @Test
    void addingAFavouriteTwiceSavesItOnce() {
        givenTheVideoAndAlice(video("Uptown Funk"));
        when(favouriteRepository.existsByUserIdAndVideoId(alice.getId(), 5L)).thenReturn(true);

        FavouriteResponse response = favouriteService.addFavourite("alice", 5L);

        verify(favouriteRepository, never()).save(any());
        assertEquals(new FavouriteResponse(5L, true), response);
    }

    @Test
    void removeFavouriteDeletesIt() {
        givenTheVideoAndAlice(video("Uptown Funk"));

        FavouriteResponse response = favouriteService.removeFavourite("alice", 5L);

        verify(favouriteRepository).deleteByUserIdAndVideoId(alice.getId(), 5L);
        assertEquals(new FavouriteResponse(5L, false), response);
    }

    @Test
    void isFavouriteTellsTheStateOfTheVideo() {
        givenTheVideoAndAlice(video("Uptown Funk"));
        when(favouriteRepository.existsByUserIdAndVideoId(alice.getId(), 5L)).thenReturn(true);

        assertEquals(new FavouriteResponse(5L, true), favouriteService.isFavourite("alice", 5L));
    }

    @Test
    void getFavouritesReturnsTheSavedVideosLastSavedFirst() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
        PageRequest request = PageRequest.of(0, 12, FavouriteService.LAST_SAVED_FIRST);
        Favourite favourite = new Favourite(alice, video("Uptown Funk"), Instant.now());
        when(favouriteRepository.findByUserId(alice.getId(), request))
                .thenReturn(new PageImpl<>(List.of(favourite), request, 1));

        PageResponse<VideoSummaryResponse> response = favouriteService.getFavourites("alice", 0, 12);

        assertEquals(1, response.totalElements());
        assertEquals("Uptown Funk", response.content().get(0).title());
    }

    @Test
    void throwsWhenTheVideoDoesNotExist() {
        when(videoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(VideoNotFoundException.class, () -> favouriteService.addFavourite("alice", 99L));
        assertThrows(VideoNotFoundException.class, () -> favouriteService.removeFavourite("alice", 99L));
        assertThrows(VideoNotFoundException.class, () -> favouriteService.isFavourite("alice", 99L));
        verify(favouriteRepository, never()).save(any());
    }

    @Test
    void throwsWhenTheUserOfTheTokenNoLongerExists() {
        when(videoRepository.findById(5L)).thenReturn(Optional.of(video("Uptown Funk")));
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> favouriteService.addFavourite("ghost", 5L));
        assertThrows(InvalidCredentialsException.class, () -> favouriteService.getFavourites("ghost", 0, 12));
        verify(favouriteRepository, never()).deleteByUserIdAndVideoId(any(), anyLong());
    }
}
