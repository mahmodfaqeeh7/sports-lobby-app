package com.sportslobby.security;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class AuthRateLimiterTests {

    @Test
    void blocksAnAccountAfterTheConfiguredLoginAttemptLimit() {
        AuthRateLimiter limiter = new AuthRateLimiter(
            new RateLimitProperties(true, 1_000),
            Clock.fixed(Instant.parse("2026-08-15T00:00:00Z"), ZoneOffset.UTC)
        );

        for (int attempt = 0; attempt < RateLimitPolicy.LOGIN_ACCOUNT.limit(); attempt++) {
            limiter.check(RateLimitPolicy.LOGIN_ACCOUNT, "+962790000001");
        }

        assertThatThrownBy(() ->
            limiter.check(RateLimitPolicy.LOGIN_ACCOUNT, "+962790000001")
        )
            .isInstanceOf(RateLimitExceededException.class)
            .hasMessage("Too many requests. Try again later.");
    }

    @Test
    void resetOnlyClearsTheRequestedAccountAndPolicy() {
        AuthRateLimiter limiter = new AuthRateLimiter(
            new RateLimitProperties(true, 1_000),
            Clock.fixed(Instant.parse("2026-08-15T00:00:00Z"), ZoneOffset.UTC)
        );
        for (int attempt = 0; attempt < RateLimitPolicy.LOGIN_ACCOUNT.limit(); attempt++) {
            limiter.check(RateLimitPolicy.LOGIN_ACCOUNT, "+962790000001");
        }

        limiter.reset(RateLimitPolicy.LOGIN_ACCOUNT, "+962790000001");

        limiter.check(RateLimitPolicy.LOGIN_ACCOUNT, "+962790000001");
    }
}
