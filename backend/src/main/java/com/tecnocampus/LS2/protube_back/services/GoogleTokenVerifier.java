package com.tecnocampus.LS2.protube_back.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Set;
import java.util.function.Predicate;

/**
 * Checks the ID token (a JWT signed by Google) that the "Sign in with Google" button gives to the frontend.
 * A token is accepted only if Google signed it, it was issued for our client id, it is not expired and the
 * email is verified.
 */
@Service
public class GoogleTokenVerifier {

    // Google's public keys; fetched (and cached) on the first verification, not on startup
    static final String GOOGLE_JWK_SET_URI = "https://www.googleapis.com/oauth2/v3/certs";
    // Google uses both forms as issuer
    static final Set<String> GOOGLE_ISSUERS = Set.of("https://accounts.google.com", "accounts.google.com");

    private final JwtDecoder decoder;

    @Autowired
    public GoogleTokenVerifier(@Value("${pro_tube.google.client-id:}") String clientId) {
        this(clientId.isBlank() ? null : googleDecoder(clientId));
    }

    // Lets tests use a decoder that trusts their own key; null means Google login is disabled
    GoogleTokenVerifier(JwtDecoder decoder) {
        this.decoder = decoder;
    }

    private static JwtDecoder googleDecoder(String clientId) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWK_SET_URI).build();
        decoder.setJwtValidator(validator(clientId));
        return decoder;
    }

    /**
     * Rules a Google ID token must follow besides having a valid signature.
     */
    static OAuth2TokenValidator<Jwt> validator(String clientId) {
        return new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                // Read as text: "accounts.google.com" is not a URL
                claimRule("iss", jwt -> GOOGLE_ISSUERS.contains(jwt.getClaimAsString("iss"))),
                claimRule("aud", jwt -> jwt.getAudience() != null && jwt.getAudience().contains(clientId)));
    }

    private static OAuth2TokenValidator<Jwt> claimRule(String claim, Predicate<Jwt> rule) {
        return jwt -> rule.test(jwt)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Invalid " + claim, null));
    }

    public GoogleAccount verify(String idToken) {
        if (decoder == null) {
            throw new InvalidGoogleTokenException("Google login is not available");
        }
        Jwt jwt;
        try {
            jwt = decoder.decode(idToken);
        } catch (JwtException e) {
            throw new InvalidGoogleTokenException("Invalid Google credential");
        }

        String email = jwt.getClaimAsString("email");
        if (email == null || !Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"))) {
            throw new InvalidGoogleTokenException("Your Google account has no verified email");
        }
        return new GoogleAccount(email.toLowerCase(Locale.ROOT), jwt.getClaimAsString("name"));
    }
}
