package com.sportslobby.auth.api;

import java.time.Instant;

public record OtpResponse(
    String status,
    Instant expiresAt,
    Instant resendAvailableAt
) {
}
