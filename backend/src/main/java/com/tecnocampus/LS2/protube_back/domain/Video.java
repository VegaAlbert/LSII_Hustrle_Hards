package com.tecnocampus.LS2.protube_back.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import org.hibernate.Length;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * A video of the catalog. Its media files ({@code videoFile}, {@code thumbnailFile}) live in the video store and are
 * served under {@code /media/**}. Videos imported from the store have no {@code uploader}; uploaded ones (US-06) are
 * owned by the user who uploaded them.
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

    // Kept in the order the uploader typed them
    @ElementCollection
    @CollectionTable(name = "video_tags", joinColumns = @JoinColumn(name = "video_id"))
    @OrderColumn(name = "position")
    @Column(name = "tag", nullable = false)
    private List<String> tags = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private VideoCategory category;

    // The default lets ddl-auto add the column to a table that already has videos
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean ageRestricted;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id")
    private User uploader;

    // Saved and deleted together with the video; newest first, the id breaks ties
    @OneToMany(mappedBy = "video", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("publishedAt DESC, id DESC")
    private List<Comment> comments = new ArrayList<>();

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

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public List<String> getTags() {
        return Collections.unmodifiableList(tags);
    }

    public void setTags(List<String> tags) {
        this.tags = new ArrayList<>(tags);
    }

    public VideoCategory getCategory() {
        return category;
    }

    public void setCategory(VideoCategory category) {
        this.category = category;
    }

    public boolean isAgeRestricted() {
        return ageRestricted;
    }

    public void setAgeRestricted(boolean ageRestricted) {
        this.ageRestricted = ageRestricted;
    }

    public User getUploader() {
        return uploader;
    }

    public void setUploader(User uploader) {
        this.uploader = uploader;
    }

    public List<Comment> getComments() {
        return Collections.unmodifiableList(comments);
    }

    public void addComment(Comment comment) {
        comment.setVideo(this);
        comments.add(comment);
    }
}
