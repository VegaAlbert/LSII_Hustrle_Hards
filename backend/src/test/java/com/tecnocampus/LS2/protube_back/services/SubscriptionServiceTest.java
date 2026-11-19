package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.SubscriberCountResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.SubscriptionResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.domain.Subscription;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.domain.Video;
import com.tecnocampus.LS2.protube_back.repository.SubscriptionRepository;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    // An imported channel: only videos have it as author, no user has that name
    private static final String BAND = "AC/DC";

    @Mock
    SubscriptionRepository subscriptionRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    VideoRepository videoRepository;

    @InjectMocks
    SubscriptionService subscriptionService;

    // Not saved, so its id is null; the repositories are mocked
    private final User alice = new User("alice", "alice@example.com", "hash");

    private void givenTheBandAndAlice() {
        when(videoRepository.existsByAuthor(BAND)).thenReturn(true);
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
    }

    @Test
    void subscribeSavesTheSubscriptionDatedNow() {
        givenTheBandAndAlice();
        when(subscriptionRepository.existsBySubscriberIdAndChannel(alice.getId(), BAND)).thenReturn(false);
        when(subscriptionRepository.countByChannel(BAND)).thenReturn(1L);
        Instant before = Instant.now();

        SubscriptionResponse response = subscriptionService.subscribe("alice", BAND);

        ArgumentCaptor<Subscription> saved = ArgumentCaptor.forClass(Subscription.class);
        verify(subscriptionRepository).save(saved.capture());
        assertSame(alice, saved.getValue().getSubscriber());
        assertEquals(BAND, saved.getValue().getChannel());
        assertFalse(saved.getValue().getSubscribedAt().isBefore(before));
        assertEquals(new SubscriptionResponse(BAND, true, 1), response);
    }

    @Test
    void subscribingAgainSavesNothing() {
        givenTheBandAndAlice();
        when(subscriptionRepository.existsBySubscriberIdAndChannel(alice.getId(), BAND)).thenReturn(true);
        when(subscriptionRepository.countByChannel(BAND)).thenReturn(1L);

        SubscriptionResponse response = subscriptionService.subscribe("alice", BAND);

        verify(subscriptionRepository, never()).save(any());
        assertEquals(new SubscriptionResponse(BAND, true, 1), response);
    }

    @Test
    void aUserWithoutVideosIsAChannelToo() {
        when(videoRepository.existsByAuthor("bob")).thenReturn(false);
        when(userRepository.existsByUsername("bob")).thenReturn(true);
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));

        assertEquals(new SubscriptionResponse("bob", true, 0), subscriptionService.subscribe("alice", "bob"));
    }

    @Test
    void subscribingToTheOwnChannelIsRejected() {
        when(videoRepository.existsByAuthor("alice")).thenReturn(true);
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));

        InvalidSubscriptionException e = assertThrows(InvalidSubscriptionException.class,
                () -> subscriptionService.subscribe("alice", "alice"));

        assertEquals("You cannot subscribe to your own channel", e.getMessage());
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void unsubscribeDeletesTheSubscription() {
        givenTheBandAndAlice();

        SubscriptionResponse response = subscriptionService.unsubscribe("alice", BAND);

        verify(subscriptionRepository).deleteBySubscriberIdAndChannel(alice.getId(), BAND);
        assertEquals(new SubscriptionResponse(BAND, false, 0), response);
    }

    @Test
    void getSubscriptionTellsWhetherTheViewerIsSubscribed() {
        givenTheBandAndAlice();
        when(subscriptionRepository.existsBySubscriberIdAndChannel(alice.getId(), BAND)).thenReturn(true);
        when(subscriptionRepository.countByChannel(BAND)).thenReturn(3L);

        assertEquals(new SubscriptionResponse(BAND, true, 3), subscriptionService.getSubscription("alice", BAND));
    }

    @Test
    void anAnonymousViewerIsNeverSubscribed() {
        when(videoRepository.existsByAuthor(BAND)).thenReturn(true);
        when(subscriptionRepository.countByChannel(BAND)).thenReturn(3L);

        assertEquals(new SubscriptionResponse(BAND, false, 3), subscriptionService.getSubscription(null, BAND));
        verify(subscriptionRepository, never()).existsBySubscriberIdAndChannel(any(), any());
    }

    @Test
    void aViewerThatNoLongerExistsCountsAsAnonymous() {
        when(videoRepository.existsByAuthor(BAND)).thenReturn(true);
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertFalse(subscriptionService.getSubscription("ghost", BAND).subscribed());
    }

    @Test
    void anUnknownChannelIsNotFound() {
        when(videoRepository.existsByAuthor("nobody")).thenReturn(false);
        when(userRepository.existsByUsername("nobody")).thenReturn(false);

        assertThrows(ChannelNotFoundException.class, () -> subscriptionService.getSubscription("alice", "nobody"));
        assertThrows(ChannelNotFoundException.class, () -> subscriptionService.subscribe("alice", "nobody"));
        assertThrows(ChannelNotFoundException.class, () -> subscriptionService.unsubscribe("alice", "nobody"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void aBlankChannelIsNotFound(String channel) {
        assertThrows(ChannelNotFoundException.class, () -> subscriptionService.getSubscription(null, channel));
    }

    @Test
    void aSubscriberThatNoLongerExistsIsRejected() {
        when(videoRepository.existsByAuthor(BAND)).thenReturn(true);
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> subscriptionService.subscribe("ghost", BAND));
        assertThrows(InvalidCredentialsException.class, () -> subscriptionService.getSubscriptionVideos("ghost", 0, 12));
    }

    @Test
    void getSubscriptionVideosReturnsTheRequestedPageNewestFirst() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
        PageRequest request = PageRequest.of(0, 12, VideoService.NEWEST_FIRST);
        Video video = new Video("abc", "Thunderstruck", null, BAND, 79, null, null,
                Instant.parse("2024-01-01T00:00:00Z"), "0.mp4", "0.webp");
        when(subscriptionRepository.findVideosOfSubscribedChannels(alice.getId(), request))
                .thenReturn(new PageImpl<>(List.of(video), request, 1));

        PageResponse<VideoSummaryResponse> response = subscriptionService.getSubscriptionVideos("alice", 0, 12);

        assertEquals(1, response.totalElements());
        assertEquals("Thunderstruck", response.content().get(0).title());
    }

    @Test
    void getSubscribedChannelsListsTheFollowedChannelsWithTheirSubscribers() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
        when(subscriptionRepository.findBySubscriberIdOrderBySubscribedAtDesc(alice.getId())).thenReturn(List.of(
                new Subscription(alice, BAND, Instant.parse("2024-02-01T00:00:00Z")),
                new Subscription(alice, "bob", Instant.parse("2024-01-01T00:00:00Z"))));
        when(subscriptionRepository.countByChannel(BAND)).thenReturn(3L);
        when(subscriptionRepository.countByChannel("bob")).thenReturn(1L);

        assertEquals(List.of(new SubscriptionResponse(BAND, true, 3), new SubscriptionResponse("bob", true, 1)),
                subscriptionService.getSubscribedChannels("alice"));
    }

    @Test
    void countSubscribersCountsTheChannelNamedAfterTheUser() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
        when(subscriptionRepository.countByChannel("alice")).thenReturn(5L);

        assertEquals(new SubscriberCountResponse(5), subscriptionService.countSubscribers("alice"));
    }
}
