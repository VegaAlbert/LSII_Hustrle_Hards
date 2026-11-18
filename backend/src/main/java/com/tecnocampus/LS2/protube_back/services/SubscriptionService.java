package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.controller.dto.PageResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.SubscriberCountResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.SubscriptionResponse;
import com.tecnocampus.LS2.protube_back.controller.dto.VideoSummaryResponse;
import com.tecnocampus.LS2.protube_back.domain.Subscription;
import com.tecnocampus.LS2.protube_back.domain.User;
import com.tecnocampus.LS2.protube_back.repository.SubscriptionRepository;
import com.tecnocampus.LS2.protube_back.repository.UserRepository;
import com.tecnocampus.LS2.protube_back.repository.VideoRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * US-13: users subscribe to channels. A channel is the author of videos: the username of the user who uploaded them
 * (uploads take the username as author) or the channel an imported video came from. So every video has a channel
 * anyone can follow, and the subscribers of a user are the subscriptions to their username.
 */
@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final VideoRepository videoRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository, UserRepository userRepository,
                               VideoRepository videoRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.videoRepository = videoRepository;
    }

    /**
     * Whether {@code viewer} is subscribed to {@code channel} and how many subscribers it has. The viewer is null for
     * an anonymous visitor, who is never subscribed.
     *
     * @throws ChannelNotFoundException if no video or user has that name
     */
    @Transactional(readOnly = true)
    public SubscriptionResponse getSubscription(String viewer, String channel) {
        requireChannel(channel);
        // A token of a user that no longer exists counts as an anonymous visitor: this route is public
        Optional<User> subscriber = viewer == null ? Optional.empty() : userRepository.findByUsername(viewer);
        boolean subscribed = subscriber
                .map(user -> subscriptionRepository.existsBySubscriberIdAndChannel(user.getId(), channel))
                .orElse(false);
        return response(channel, subscribed);
    }

    /**
     * Subscribes {@code username} to {@code channel}. Subscribing again changes nothing.
     *
     * @throws ChannelNotFoundException     if no video or user has that name
     * @throws InvalidSubscriptionException if it is the channel of the user
     * @throws InvalidCredentialsException  if the user of the token no longer exists
     */
    @Transactional
    public SubscriptionResponse subscribe(String username, String channel) {
        requireChannel(channel);
        User subscriber = findUser(username);
        if (subscriber.getUsername().equals(channel)) {
            throw new InvalidSubscriptionException("error.subscription.self",
                    "You cannot subscribe to your own channel");
        }
        if (!subscriptionRepository.existsBySubscriberIdAndChannel(subscriber.getId(), channel)) {
            subscriptionRepository.save(new Subscription(subscriber, channel, Instant.now()));
        }
        return response(channel, true);
    }

    /**
     * Unsubscribes {@code username} from {@code channel}. Unsubscribing when not subscribed changes nothing.
     *
     * @throws ChannelNotFoundException    if no video or user has that name
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional
    public SubscriptionResponse unsubscribe(String username, String channel) {
        requireChannel(channel);
        User subscriber = findUser(username);
        subscriptionRepository.deleteBySubscriberIdAndChannel(subscriber.getId(), channel);
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
     * How many users are subscribed to the channel of {@code username}, i.e. to their username.
     *
     * @throws InvalidCredentialsException if the user of the token no longer exists
     */
    @Transactional(readOnly = true)
    public SubscriberCountResponse countSubscribers(String username) {
        User user = findUser(username);
        return new SubscriberCountResponse(subscriptionRepository.countByChannel(user.getUsername()));
    }

    private SubscriptionResponse response(String channel, boolean subscribed) {
        return new SubscriptionResponse(channel, subscribed, subscriptionRepository.countByChannel(channel));
    }

    // A channel exists when a video has it as author or, for a user who has not uploaded anything yet, a username
    private void requireChannel(String channel) {
        if (channel == null || channel.isBlank()
                || !(videoRepository.existsByAuthor(channel) || userRepository.existsByUsername(channel))) {
            throw new ChannelNotFoundException(channel);
        }
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username).orElseThrow(InvalidCredentialsException::new);
    }
}
