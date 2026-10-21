package com.tecnocampus.LS2.protube_back.services;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/**
 * Creates and validates the signed tokens (JWT) that keep a user logged in.
 * The token stores the username and an expiration date; once expired the user has to log in again.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final Duration expiration;

    public JwtService(@Value("${pro_tube.jwt.secret}") String secret,
                      @Value("${pro_tube.jwt.expiration-minutes}") long expirationMinutes) {
        // HMAC-SHA256 needs a key of at least 32 bytes, otherwise this throws on startup
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = Duration.ofMinutes(expirationMinutes);
    }

    public String generateToken(String username) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(username)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiration)))
                .signWith(key)
                .compact();
    }

    /**
     * @return the username stored in the token, or empty if the token is invalid, tampered or expired
     */
    public Optional<String> extractUsername(String token) {
        try {
            return Optional.ofNullable(Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
