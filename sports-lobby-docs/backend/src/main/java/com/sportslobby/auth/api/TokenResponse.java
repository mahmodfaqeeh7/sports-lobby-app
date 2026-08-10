package com.sportslobby.auth.api;

import com.sportslobby.auth.domain.AuthTokens;
import java.time.Instant;

public record TokenResponse(
    String accessToken,
    Instant accessTokenExpiresAt,
    String refreshToken,
    Instant refreshTokenExpiresAt,
    String tokenType
) {
    public static TokenResponse from(AuthTokens tokens) {
        return new TokenResponse(
            tokens.accessToken(),
            tokens.accessTokenExpiresAt(),
            tokens.refreshToken(),
            tokens.refreshTokenExpiresAt(),
            "Bearer"
        );
    }
}
