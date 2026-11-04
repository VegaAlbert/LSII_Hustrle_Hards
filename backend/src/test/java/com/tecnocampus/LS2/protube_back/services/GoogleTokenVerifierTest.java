package com.tecnocampus.LS2.protube_back.services;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Signs tokens with a test RSA key (playing the role of Google) and checks the same rules used in production.
 */
class GoogleTokenVerifierTest {

    private static final String CLIENT_ID = "protube-client.apps.googleusercontent.com";

    private static KeyPair keys;
    private static GoogleTokenVerifier verifier;

    @BeforeAll
    static void setUp() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keys = generator.generateKeyPair();

        NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey((RSAPublicKey) keys.getPublic()).build();
        decoder.setJwtValidator(GoogleTokenVerifier.validator(CLIENT_ID));
        verifier = new GoogleTokenVerifier(decoder);
    }

    private static JWTClaimsSet.Builder validClaims() {
        Instant now = Instant.now();
        return new JWTClaimsSet.Builder()
                .issuer("https://accounts.google.com")
                .audience(CLIENT_ID)
                .subject("1234567890")
                .claim("email", "Alice@Gmail.com")
                .claim("email_verified", true)
                .claim("name", "Alice")
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(3600)));
    }

    private static String sign(JWTClaimsSet claims) throws Exception {
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims);
        jwt.sign(new RSASSASigner(keys.getPrivate()));
        return jwt.serialize();
    }

    @Test
    void acceptsValidTokenAndReturnsAccount() throws Exception {
        GoogleAccount account = verifier.verify(sign(validClaims().build()));

        assertEquals("alice@gmail.com", account.email());
        assertEquals("Alice", account.name());
    }

    @Test
    void acceptsIssuerWithoutScheme() throws Exception {
        GoogleAccount account = verifier.verify(sign(validClaims().issuer("accounts.google.com").build()));

        assertEquals("alice@gmail.com", account.email());
    }

    @Test
    void rejectsTokenForAnotherClient() throws Exception {
        String token = sign(validClaims().audience("other-app.apps.googleusercontent.com").build());

        assertThrows(InvalidGoogleTokenException.class, () -> verifier.verify(token));
    }

    @Test
    void rejectsTokenFromAnotherIssuer() throws Exception {
        String token = sign(validClaims().issuer("https://evil.example.com").build());

        assertThrows(InvalidGoogleTokenException.class, () -> verifier.verify(token));
    }

    @Test
    void rejectsExpiredToken() throws Exception {
        Instant past = Instant.now().minusSeconds(7200);
        String token = sign(validClaims()
                .issueTime(Date.from(past))
                .expirationTime(Date.from(past.plusSeconds(3600)))
                .build());

        assertThrows(InvalidGoogleTokenException.class, () -> verifier.verify(token));
    }

    @Test
    void rejectsUnverifiedEmail() throws Exception {
        String token = sign(validClaims().claim("email_verified", false).build());

        InvalidGoogleTokenException e = assertThrows(InvalidGoogleTokenException.class, () -> verifier.verify(token));
        assertEquals("Your Google account has no verified email", e.getMessage());
    }

    @Test
    void rejectsGarbage() {
        assertThrows(InvalidGoogleTokenException.class, () -> verifier.verify("not-a-jwt"));
    }

    @Test
    void rejectsEverythingWhenNoClientIdIsConfigured() {
        GoogleTokenVerifier disabled = new GoogleTokenVerifier("");

        InvalidGoogleTokenException e = assertThrows(InvalidGoogleTokenException.class, () -> disabled.verify("x"));
        assertEquals("Google login is not available", e.getMessage());
    }

    @Test
    void buildsGoogleDecoderWhenClientIdIsConfigured() {
        // Google's keys are only downloaded on the first verification, so this needs no network
        new GoogleTokenVerifier(CLIENT_ID);
    }
}
