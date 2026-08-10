package com.sportslobby.auth.domain;

import java.time.Instant;
import java.util.UUID;

public record PasswordResetToken(
    UUID id,
    UUID userId,
    String tokenHash,
    Instant expiresAt,
    Instant consumedAt,
    Instant createdAt
) {
    public boolean isUsableAt(Instant now) {
        return consumedAt == null && expiresAt.isAfter(now);
    }
}
