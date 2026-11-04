package com.tecnocampus.LS2.protube_back.services;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String SECRET = "test-secret-with-at-least-32-characters!!";

    JwtService jwtService = new JwtService(SECRET, 60);

    @Test
    void shouldReadUsernameFromGeneratedToken() {
        String token = jwtService.generateToken("alice");

        assertEquals(Optional.of("alice"), jwtService.extractUsername(token));
    }

    @Test
    void shouldRejectMalformedToken() {
        assertTrue(jwtService.extractUsername("not-a-jwt").isEmpty());
    }

    @Test
    void shouldRejectEmptyToken() {
        assertTrue(jwtService.extractUsername("").isEmpty());
    }

    @Test
    void shouldRejectExpiredToken() {
        JwtService alreadyExpired = new JwtService(SECRET, -1);
        String token = alreadyExpired.generateToken("alice");

        assertTrue(jwtService.extractUsername(token).isEmpty());
    }

    @Test
    void shouldRejectTokenSignedWithAnotherSecret() {
        JwtService otherService = new JwtService("another-secret-with-at-least-32-characters", 60);
        String token = otherService.generateToken("alice");

        assertTrue(jwtService.extractUsername(token).isEmpty());
    }
}
