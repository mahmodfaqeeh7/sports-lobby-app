package com.sportslobby.security;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sportslobby.auth.application.AuthProperties;
import com.sportslobby.auth.integration.TwilioSmsProperties;
import com.sportslobby.files.application.FileStorageProperties;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class ProductionReadinessValidatorTests {

    @Test
    void rejectsDevelopmentSecuritySettingsInProductionMode() {
        ProductionReadinessValidator validator = new ProductionReadinessValidator(
            auth("dev-only-change-me-dev-only-change-me-32", true),
            new TwilioSmsProperties(false, null, null, null, null, null, null),
            files("local"),
            new RateLimitProperties(false, 1_000),
            false
        );

        assertThatThrownBy(() -> validator.run(null))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("replace the development access-token secret")
            .hasMessageContaining("disable the test OTP code")
            .hasMessageContaining("enable HTTPS enforcement")
            .hasMessageContaining("enable the SMS provider")
            .hasMessageContaining("enable authentication rate limiting")
            .hasMessageContaining("use S3-compatible private object storage");
    }

    @Test
    void acceptsHardenedProductionSettings() {
        ProductionReadinessValidator validator = new ProductionReadinessValidator(
            auth("a-production-secret-with-more-than-32-random-characters", false),
            new TwilioSmsProperties(true, "account", null, "key", "secret", "+15551234567", null),
            files("s3"),
            new RateLimitProperties(true, 100_000),
            true
        );

        assertThatCode(() -> validator.run(null)).doesNotThrowAnyException();
    }

    private AuthProperties auth(String secret, boolean testOtpEnabled) {
        return new AuthProperties(
            secret,
            Duration.ofMinutes(15),
            Duration.ofDays(30),
            new AuthProperties.Otp(Duration.ofMinutes(5), Duration.ofMinutes(1), 5, testOtpEnabled),
            new AuthProperties.PasswordReset(Duration.ofMinutes(15))
        );
    }

    private FileStorageProperties files(String provider) {
        return new FileStorageProperties(
            provider,
            "kyc-private",
            "vendor-verification",
            "court-images",
            Duration.ofMinutes(10),
            Duration.ofMinutes(5),
            5 * 1024 * 1024,
            5 * 1024 * 1024,
            "http://localhost:8080",
            ".local-object-storage"
        );
    }
}
