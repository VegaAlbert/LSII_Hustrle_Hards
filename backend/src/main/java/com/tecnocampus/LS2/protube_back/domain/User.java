package com.tecnocampus.LS2.protube_back.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    // Only the BCrypt hash is stored, never the plain password
    @Column(nullable = false)
    private String passwordHash;

    // False for accounts created with "Sign in with Google" (they get a random password nobody knows) until the user
    // sets one in the settings. The default fills the rows that existed before this column
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean passwordSet = true;

    // Subject ("sub") of the linked Google account: keeps Google login working after the user changes the email
    @Column(unique = true)
    private String googleId;

    @Column(nullable = false)
    private Instant createdAt;

    protected User() {
        // Required by JPA
    }

    public User(String username, String email, String passwordHash) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isPasswordSet() {
        return passwordSet;
    }

    public String getGoogleId() {
        return googleId;
    }

    /**
     * Account created with "Sign in with Google": its random password is not marked as set.
     */
    public static User fromGoogle(String username, String email, String randomPasswordHash, String googleId) {
        User user = new User(username, email, randomPasswordHash);
        user.passwordSet = false;
        user.googleId = googleId;
        return user;
    }

    public void linkGoogleAccount(String googleId) {
        this.googleId = googleId;
    }

    public void changeUsername(String username) {
        this.username = username;
    }

    public void changeEmail(String email) {
        this.email = email;
    }

    public void changePassword(String passwordHash) {
        this.passwordHash = passwordHash;
        this.passwordSet = true;
    }
}
