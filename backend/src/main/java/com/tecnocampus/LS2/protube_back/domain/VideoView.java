package com.tecnocampus.LS2.protube_back.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * One time a video was opened (US-11). {@code viewer} is the logged-in user who watched it, or null for an anonymous
 * visitor, so the analytics can tell authenticated views from anonymous ones and draw the views over time.
 */
@Entity
@Table(name = "video_views", indexes = @Index(name = "idx_video_views_video", columnList = "video_id"))
public class VideoView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "video_id", nullable = false)
    private Video video;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viewer_id")
    private User viewer;

    @Column(nullable = false)
    private Instant viewedAt;

    protected VideoView() {
        // Required by JPA
    }

    public VideoView(Video video, User viewer, Instant viewedAt) {
        this.video = video;
        this.viewer = viewer;
        this.viewedAt = viewedAt;
    }

    public Long getId() {
        return id;
    }

    public Video getVideo() {
        return video;
    }

    public User getViewer() {
        return viewer;
    }

    public Instant getViewedAt() {
        return viewedAt;
    }
}
