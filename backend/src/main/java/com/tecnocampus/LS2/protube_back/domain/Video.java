package com.tecnocampus.LS2.protube_back.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.Length;

import java.time.Instant;

/**
 * A video of the catalog. Its media files ({@code videoFile}, {@code thumbnailFile}) live in the video store and are
 * served under {@code /media/**}. Tags, categories and comments are added by US-07 / US-09.
 */
@Entity
@Table(name = "videos")
public class Video {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Id of the video in the store (the "id" of its json file); used to avoid importing it twice
    @Column(nullable = false, unique = true)
    private String storeId;

    @Column(nullable = false)
    private String title;

    // Mapped to an unbounded text column: descriptions are often longer than a default varchar
    @Column(length = Length.LONG32)
    private String description;

    private String author;

    @Column(nullable = false)
    private int durationSeconds;

    private Integer width;

    private Integer height;

    @Column(nullable = false)
    private Instant publishedAt;

    @Column(nullable = false)
    private String videoFile;

    @Column(nullable = false)
    private String thumbnailFile;

    protected Video() {
        // Required by JPA
    }

    public Video(String storeId, String title, String description, String author, int durationSeconds,
                 Integer width, Integer height, Instant publishedAt, String videoFile, String thumbnailFile) {
        this.storeId = storeId;
        this.title = title;
        this.description = description;
        this.author = author;
        this.durationSeconds = durationSeconds;
        this.width = width;
        this.height = height;
        this.publishedAt = publishedAt;
        this.videoFile = videoFile;
        this.thumbnailFile = thumbnailFile;
    }

    public Long getId() {
        return id;
    }

    public String getStoreId() {
        return storeId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getAuthor() {
        return author;
    }

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public Integer getWidth() {
        return width;
    }

    public Integer getHeight() {
        return height;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public String getVideoFile() {
        return videoFile;
    }

    public String getThumbnailFile() {
        return thumbnailFile;
    }
}
