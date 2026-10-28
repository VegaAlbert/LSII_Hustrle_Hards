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
import org.hibernate.Length;

import java.time.Instant;

/**
 * A comment of a video. US-05 only shows the comments imported from the video store; US-09 adds new ones.
 */
@Entity
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "video_id", nullable = false)
    private Video video;

    @Column(nullable = false)
    private String author;

    @Column(nullable = false, length = Length.LONG32)
    private String text;

    @Column(nullable = false)
    private int likeCount;

    private Instant publishedAt;

    protected Comment() {
        // Required by JPA
    }

    public Comment(String author, String text, int likeCount, Instant publishedAt) {
        this.author = author;
        this.text = text;
        this.likeCount = likeCount;
        this.publishedAt = publishedAt;
    }

    // Set by Video.addComment so both sides of the relation stay consistent
    void setVideo(Video video) {
        this.video = video;
    }

    public Long getId() {
        return id;
    }

    public Video getVideo() {
        return video;
    }

    public String getAuthor() {
        return author;
    }

    public String getText() {
        return text;
    }

    public int getLikeCount() {
        return likeCount;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }
}
