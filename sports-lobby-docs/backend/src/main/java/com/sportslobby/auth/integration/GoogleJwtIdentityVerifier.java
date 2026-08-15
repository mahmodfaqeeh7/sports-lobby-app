package com.sportslobby.auth.integration;

import com.sportslobby.auth.application.GoogleAuthProperties;
import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

@Component
public class GoogleJwtIdentityVerifier implements GoogleIdentityVerifier {
    private static final String ISSUER = "https://accounts.google.com";

    private final GoogleAuthProperties properties;
    private final NimbusJwtDecoder decoder;

    public GoogleJwtIdentityVerifier(GoogleAuthProperties properties) {
        this.properties = properties;
        if (!properties.enabled() || properties.clientId() == null || properties.clientId().isBlank()) {
            this.decoder = null;
            return;
        }
        this.decoder = NimbusJwtDecoder.withIssuerLocation(ISSUER).build();
        this.decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(ISSUER));
    }

    @Override
    public GoogleIdentity verify(String idToken) {
        if (decoder == null) {
            throw new ApiException(
                HttpStatus.SERVICE_UNAVAILABLE,
                ApiErrorCode.CONFLICT,
                "Google sign-in is not configured on this environment."
            );
        }

        try {
            Jwt jwt = decoder.decode(idToken);
            List<String> audience = jwt.getAudience();
            Boolean emailVerified = jwt.getClaim("email_verified");
            String email = jwt.getClaimAsString("email");
            if (!audience.contains(properties.clientId()) || !Boolean.TRUE.equals(emailVerified) || email == null) {
                throw invalidToken();
            }
            return new GoogleIdentity(
                jwt.getSubject(),
                email,
                defaultName(jwt.getClaimAsString("given_name"), "Google"),
                defaultName(jwt.getClaimAsString("family_name"), "User")
            );
        } catch (JwtException exception) {
            throw invalidToken();
        }
    }

    private String defaultName(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private ApiException invalidToken() {
        return new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHENTICATED, "Invalid Google identity token.");
    }
}
