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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock
    SubscriptionRepository subscriptionRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    SubscriptionService subscriptionService;

    // Not saved, so their ids are null; the repositories are mocked
    private final User alice = new User("alice", "alice@example.com", "hash");
    private final User bob = new User("bob", "bob@example.com", "hash");

    private void givenAliceAndBob() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(bob));
    }

    @Test
    void subscribeSavesTheSubscriptionDatedNow() {
        givenAliceAndBob();
        when(subscriptionRepository.existsBySubscriberIdAndChannelId(alice.getId(), bob.getId())).thenReturn(false);
        when(subscriptionRepository.countByChannelId(bob.getId())).thenReturn(1L);
        Instant before = Instant.now();

        SubscriptionResponse response = subscriptionService.subscribe("alice", "bob");

        ArgumentCaptor<Subscription> saved = ArgumentCaptor.forClass(Subscription.class);
        verify(subscriptionRepository).save(saved.capture());
        assertSame(alice, saved.getValue().getSubscriber());
        assertSame(bob, saved.getValue().getChannel());
        assertFalse(saved.getValue().getSubscribedAt().isBefore(before));
        assertEquals(new SubscriptionResponse("bob", true, 1), response);
    }

    @Test
    void subscribingAgainSavesNothing() {
        givenAliceAndBob();
        when(subscriptionRepository.existsBySubscriberIdAndChannelId(alice.getId(), bob.getId())).thenReturn(true);
        when(subscriptionRepository.countByChannelId(bob.getId())).thenReturn(1L);

        SubscriptionResponse response = subscriptionService.subscribe("alice", "bob");

        verify(subscriptionRepository, never()).save(any());
        assertEquals(new SubscriptionResponse("bob", true, 1), response);
    }

    @Test
    void subscribingToTheOwnChannelIsRejected() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));

        InvalidSubscriptionException e = assertThrows(InvalidSubscriptionException.class,
                () -> subscriptionService.subscribe("alice", "alice"));

        assertEquals("You cannot subscribe to your own channel", e.getMessage());
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void unsubscribeDeletesTheSubscription() {
        givenAliceAndBob();
        when(subscriptionRepository.countByChannelId(bob.getId())).thenReturn(0L);

        SubscriptionResponse response = subscriptionService.unsubscribe("alice", "bob");

        verify(subscriptionRepository).deleteBySubscriberIdAndChannelId(alice.getId(), bob.getId());
        assertEquals(new SubscriptionResponse("bob", false, 0), response);
    }

    @Test
    void getSubscriptionTellsWhetherTheViewerIsSubscribed() {
        givenAliceAndBob();
        when(subscriptionRepository.existsBySubscriberIdAndChannelId(alice.getId(), bob.getId())).thenReturn(true);
        when(subscriptionRepository.countByChannelId(bob.getId())).thenReturn(3L);

        assertEquals(new SubscriptionResponse("bob", true, 3), subscriptionService.getSubscription("alice", "bob"));
    }

    @Test
    void anAnonymousViewerIsNeverSubscribed() {
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(bob));
        when(subscriptionRepository.countByChannelId(bob.getId())).thenReturn(3L);

        assertEquals(new SubscriptionResponse("bob", false, 3), subscriptionService.getSubscription(null, "bob"));
        verify(subscriptionRepository, never()).existsBySubscriberIdAndChannelId(any(), any());
    }

    @Test
    void aViewerThatNoLongerExistsCountsAsAnonymous() {
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(bob));
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertFalse(subscriptionService.getSubscription("ghost", "bob").subscribed());
    }

    @Test
    void anUnknownChannelIsNotFound() {
        when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());

        assertThrows(ChannelNotFoundException.class, () -> subscriptionService.getSubscription("alice", "nobody"));
        assertThrows(ChannelNotFoundException.class, () -> subscriptionService.subscribe("alice", "nobody"));
        assertThrows(ChannelNotFoundException.class, () -> subscriptionService.unsubscribe("alice", "nobody"));
    }

    @Test
    void aSubscriberThatNoLongerExistsIsRejected() {
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(bob));
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> subscriptionService.subscribe("ghost", "bob"));
        assertThrows(InvalidCredentialsException.class, () -> subscriptionService.getSubscriptionVideos("ghost", 0, 12));
    }

    @Test
    void getSubscriptionVideosReturnsTheRequestedPageNewestFirst() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
        PageRequest request = PageRequest.of(0, 12, VideoService.NEWEST_FIRST);
        Video video = new Video("abc", "Bob video", null, "bob", 79, null, null,
                Instant.parse("2024-01-01T00:00:00Z"), "0.mp4", "0.webp");
        when(subscriptionRepository.findVideosOfSubscribedChannels(alice.getId(), request))
                .thenReturn(new PageImpl<>(List.of(video), request, 1));

        PageResponse<VideoSummaryResponse> response = subscriptionService.getSubscriptionVideos("alice", 0, 12);

        assertEquals(1, response.totalElements());
        assertEquals("Bob video", response.content().get(0).title());
    }

    @Test
    void countSubscribersCountsTheChannelOfTheUser() {
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(bob));
        when(subscriptionRepository.countByChannelId(bob.getId())).thenReturn(5L);

        assertEquals(new SubscriberCountResponse(5), subscriptionService.countSubscribers("bob"));
    }
}
