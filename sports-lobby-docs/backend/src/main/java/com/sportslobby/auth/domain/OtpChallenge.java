package com.sportslobby.auth.domain;

import java.time.Instant;
import java.util.UUID;

public record OtpChallenge(
    UUID id,
    String phoneE164,
    OtpPurpose purpose,
    String codeHash,
    Instant expiresAt,
    Instant consumedAt,
    int attemptCount,
    int maxAttempts,
    Instant resendAvailableAt,
    UUID requestedByUserId,
    Instant createdAt
) {
    public boolean isActiveAt(Instant now) {
        return consumedAt == null && expiresAt.isAfter(now) && attemptCount < maxAttempts;
    }
}
