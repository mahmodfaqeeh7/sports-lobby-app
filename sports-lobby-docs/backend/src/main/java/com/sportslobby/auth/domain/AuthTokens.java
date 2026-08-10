package com.sportslobby.auth.domain;

import java.time.Instant;

public record AuthTokens(
    String accessToken,
    Instant accessTokenExpiresAt,
    String refreshToken,
    Instant refreshTokenExpiresAt
) {
}
