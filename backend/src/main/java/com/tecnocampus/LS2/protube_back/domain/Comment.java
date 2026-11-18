package com.tecnocampus.LS2.protube_back.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import org.hibernate.Length;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * A comment of a video. US-05 only shows the comments imported from the video store; US-09 adds new ones and US-10
 * adds replies (comments with a {@code parent}) and likes.
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

    // Account that wrote the comment in ProTube, to rename or delete its comments with the account. Null for the
    // comments imported from the store, whose author is only a name
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = Length.LONG32)
    private String text;

    @Column(nullable = false)
    private int likeCount;

    private Instant publishedAt;

    // US-10: the top-level comment this one replies to; null for a top-level comment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;

    // US-10: oldest first, so a conversation reads from top to bottom. Saved with the video, as every comment
    @OneToMany(mappedBy = "parent")
    @OrderBy("publishedAt ASC, id ASC")
    private List<Comment> replies = new ArrayList<>();

    protected Comment() {
        // Required by JPA
    }

    public Comment(String author, String text, int likeCount, Instant publishedAt) {
        this.author = author;
        this.text = text;
        this.likeCount = likeCount;
        this.publishedAt = publishedAt;
    }

    /**
     * A comment written in ProTube by {@code user}, dated {@code publishedAt} and without likes.
     */
    public Comment(User user, String text, Instant publishedAt) {
        this(user.getUsername(), text, 0, publishedAt);
        this.user = user;
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

    public User getUser() {
        return user;
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

    public Comment getParent() {
        return parent;
    }

    public List<Comment> getReplies() {
        return Collections.unmodifiableList(replies);
    }

    /**
     * US-10: links a reply to this comment. The caller also adds it to the video with {@link Video#addComment}.
     */
    public void addReply(Comment reply) {
        reply.parent = this;
        replies.add(reply);
    }
}
