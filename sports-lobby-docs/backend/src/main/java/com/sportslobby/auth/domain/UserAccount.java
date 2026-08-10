package com.sportslobby.auth.domain;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record UserAccount(
    UUID id,
    String firstName,
    String lastName,
    String email,
    String phoneE164,
    Instant phoneVerifiedAt,
    String passwordHash,
    UserStatus status,
    Set<UserRole> roles
) {
    public boolean isPhoneVerified() {
        return phoneVerifiedAt != null;
    }
}
