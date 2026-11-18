package com.tecnocampus.LS2.protube_back.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

/**
 * US-13: a user ({@code subscriber}) follows the channel of another user ({@code channel}), i.e. the videos that user
 * uploads. The unique pair keeps a user from subscribing twice to the same channel.
 */
@Entity
@Table(name = "subscriptions", uniqueConstraints = @UniqueConstraint(columnNames = {"subscriber_id", "channel_id"}))
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The database removes the subscriptions of a deleted user, on both sides
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subscriber_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User subscriber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "channel_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User channel;

    @Column(nullable = false)
    private Instant subscribedAt;

    protected Subscription() {
        // Required by JPA
    }

    public Subscription(User subscriber, User channel, Instant subscribedAt) {
        this.subscriber = subscriber;
        this.channel = channel;
        this.subscribedAt = subscribedAt;
    }

    public Long getId() {
        return id;
    }

    public User getSubscriber() {
        return subscriber;
    }

    public User getChannel() {
        return channel;
    }

    public Instant getSubscribedAt() {
        return subscribedAt;
    }
}
