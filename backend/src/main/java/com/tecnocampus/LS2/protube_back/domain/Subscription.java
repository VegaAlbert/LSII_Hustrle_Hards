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
 * US-13: a user ({@code subscriber}) follows a channel. A channel is the author of videos ({@link Video#getAuthor()}):
 * the username of the user who uploaded them, or the channel an imported video came from. The unique pair keeps a
 * user from subscribing twice to the same channel.
 */
@Entity
// Not "subscriptions": the first version used that table with another shape, and ddl-auto=update cannot change it
@Table(name = "channel_subscriptions", uniqueConstraints = @UniqueConstraint(columnNames = {"subscriber_id", "channel"}))
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The database removes the subscriptions of a deleted user
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subscriber_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User subscriber;

    @Column(nullable = false)
    private String channel;

    @Column(nullable = false)
    private Instant subscribedAt;

    protected Subscription() {
        // Required by JPA
    }

    public Subscription(User subscriber, String channel, Instant subscribedAt) {
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

    public String getChannel() {
        return channel;
    }

    public Instant getSubscribedAt() {
        return subscribedAt;
    }
}
