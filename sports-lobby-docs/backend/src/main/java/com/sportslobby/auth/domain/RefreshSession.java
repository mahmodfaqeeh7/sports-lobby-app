package com.sportslobby.auth.domain;

import java.time.Instant;
import java.util.UUID;

public record RefreshSession(
    UUID id,
    UUID userId,
    String tokenHash,
    String deviceLabel,
    Instant expiresAt,
    Instant revokedAt,
    UUID replacedBySessionId,
    Instant createdAt,
    Instant lastUsedAt
) {
    public boolean isUsableAt(Instant now) {
        return revokedAt == null && expiresAt.isAfter(now);
    }
}
