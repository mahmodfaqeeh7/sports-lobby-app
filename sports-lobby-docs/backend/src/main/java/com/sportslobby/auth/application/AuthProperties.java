package com.sportslobby.auth.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(
    @NotBlank String accessTokenSecret,
    Duration accessTokenTtl,
    Duration refreshTokenTtl,
    Otp otp,
    PasswordReset passwordReset
) {
    public AuthProperties {
        if (accessTokenSecret != null && accessTokenSecret.length() < 32) {
            throw new IllegalArgumentException("app.auth.access-token-secret must be at least 32 characters.");
        }
        if (accessTokenTtl == null) {
            accessTokenTtl = Duration.ofMinutes(15);
        }
        if (refreshTokenTtl == null) {
            refreshTokenTtl = Duration.ofDays(30);
        }
        if (otp == null) {
            otp = new Otp(Duration.ofMinutes(5), Duration.ofSeconds(60), 5);
        }
        if (passwordReset == null) {
            passwordReset = new PasswordReset(Duration.ofMinutes(15));
        }
    }

    public record Otp(
        Duration ttl,
        Duration resendCooldown,
        @Positive int maxAttempts
    ) {
        public Otp {
            if (ttl == null) {
                ttl = Duration.ofMinutes(5);
            }
            if (resendCooldown == null) {
                resendCooldown = Duration.ofSeconds(60);
            }
        }
    }

    public record PasswordReset(Duration ttl) {
        public PasswordReset {
            if (ttl == null) {
                ttl = Duration.ofMinutes(15);
            }
        }
    }
}
