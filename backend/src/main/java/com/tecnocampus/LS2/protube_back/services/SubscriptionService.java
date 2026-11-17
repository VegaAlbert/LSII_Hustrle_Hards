package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.SubscriberCountResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.SubscriptionResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.domain.Subscription;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.repository.SubscriptionRepository;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * US-13: users subscribe to the channels of other users. A channel is identified by the username of its owner and
 * holds the videos that user uploaded (imported videos have no owner, so they belong to no channel).
 */
@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository, UserRepository userRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Whether {@code viewer} is subscribed to {@code channelName} and how many subscribers the channel has. The viewer
     * is null for an anonymous visitor, who is never subscribed.
     *
     * @throws ChannelNotFoundException if the channel does not exist
     */
    @Transactional(readOnly = true)
    public SubscriptionResponse getSubscription(String viewer, String channelName) {
        User channel = findChannel(channelName);
        // A token of a user that no longer exists counts as an anonymous visitor: this route is public
        Optional<User> subscriber = viewer == null ? Optional.empty() : userRepository.findByUsername(viewer);
        boolean subscribed = subscriber
                .map(user -> subscriptionRepository.existsBySubscriberIdAndChannelId(user.getId(), channel.getId()))
                .orElse(false);
        return response(channel, subscribed);
    }

    /**
     * Subscribes {@code username} to {@code channelName}. Subscribing again changes nothing.
     *
     * @throws ChannelNotFoundException     if the channel does not exist
     * @throws InvalidSubscriptionException if it is the channel of the user
     * @throws InvalidCredentialsException  if the user of the token no longer exists
     */
    @Transactional
    public SubscriptionResponse subscribe(String username, String channelName) {
        User channel = findChannel(channelName);
        User subscriber = findUser(username);
        if (subscriber.getUsername().equals(channel.getUsername())) {
            throw new InvalidSubscriptionException("You cannot subscribe to your own channel");
        }
        if (!subscriptionRepository.existsBySubscriberIdAndChannelId(subscriber.getId(), channel.getId())) {
            subscriptionRepository.save(new Subscription(subscriber, channel, Instant.now()));
        }
        return response(channel, true);
    }

    /**
     * Unsubscribes {@code username} from {@code channelName}. Unsubscribing when not subscribed changes nothing.
     *
     * @throws ChannelNotFoundException    if the channel does not exist
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional
    public SubscriptionResponse unsubscribe(String username, String channelName) {
        User channel = findChannel(channelName);
        User subscriber = findUser(username);
        subscriptionRepository.deleteBySubscriberIdAndChannelId(subscriber.getId(), channel.getId());
        return response(channel, false);
    }

    /**
     * One page of the videos of the channels {@code username} is subscribed to, newest first.
     *
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional(readOnly = true)
    public PageResponse<VideoSummaryResponse> getSubscriptionVideos(String username, int page, int size) {
        User subscriber = findUser(username);
        return PageResponse.from(subscriptionRepository.findVideosOfSubscribedChannels(subscriber.getId(),
                        PageRequest.of(page, size, VideoService.NEWEST_FIRST))
                .map(VideoSummaryResponse::from));
    }

    /**
     * How many users are subscribed to the channel of {@code username}.
     *
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional(readOnly = true)
    public SubscriberCountResponse countSubscribers(String username) {
        User channel = findUser(username);
        return new SubscriberCountResponse(subscriptionRepository.countByChannelId(channel.getId()));
    }

    private SubscriptionResponse response(User channel, boolean subscribed) {
        return new SubscriptionResponse(channel.getUsername(), subscribed,
                subscriptionRepository.countByChannelId(channel.getId()));
    }

    private User findChannel(String channelName) {
        return userRepository.findByUsername(channelName).orElseThrow(() -> new ChannelNotFoundException(channelName));
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username).orElseThrow(InvalidCredentialsException::new);
    }
}
