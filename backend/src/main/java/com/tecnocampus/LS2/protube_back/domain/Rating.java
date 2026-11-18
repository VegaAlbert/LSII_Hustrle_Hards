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
 * Video ratings: the score from 1 to 5 stars that a user gave to a video. The unique pair (user, video) makes the
 * database reject a second rating of the same user for the same video: rating again changes this one.
 */
@Entity
@Table(name = "video_ratings", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "video_id"}))
public class Rating {

    public static final int MIN_SCORE = 1;
    public static final int MAX_SCORE = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The database removes the ratings of a deleted user or video
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "video_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Video video;

    @Column(nullable = false)
    private int score;

    // When it was given or last changed
    @Column(nullable = false)
    private Instant ratedAt;

    protected Rating() {
        // Required by JPA
    }

    public Rating(User user, Video video, int score, Instant ratedAt) {
        this.user = user;
        this.video = video;
        changeScore(score, ratedAt);
    }

    /**
     * Replaces the score of an existing rating. The range is also validated in the request, this is the last check.
     */
    public void changeScore(int score, Instant ratedAt) {
        if (score < MIN_SCORE || score > MAX_SCORE) {
            throw new IllegalArgumentException("Score must be between " + MIN_SCORE + " and " + MAX_SCORE);
        }
        this.score = score;
        this.ratedAt = ratedAt;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Video getVideo() {
        return video;
    }

    public int getScore() {
        return score;
    }

    public Instant getRatedAt() {
        return ratedAt;
    }
}
