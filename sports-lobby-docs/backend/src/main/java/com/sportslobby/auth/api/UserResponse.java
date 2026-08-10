package com.sportslobby.auth.api;

import com.sportslobby.auth.domain.UserAccount;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record UserResponse(
    UUID id,
    String firstName,
    String lastName,
    String email,
    String phoneE164,
    boolean phoneVerified,
    Instant phoneVerifiedAt,
    String status,
    Set<String> roles
) {
    public static UserResponse from(UserAccount user) {
        return new UserResponse(
            user.id(),
            user.firstName(),
            user.lastName(),
            user.email(),
            user.phoneE164(),
            user.isPhoneVerified(),
            user.phoneVerifiedAt(),
            user.status().name(),
            user.roles().stream().map(Enum::name).collect(Collectors.toUnmodifiableSet())
        );
    }
}
