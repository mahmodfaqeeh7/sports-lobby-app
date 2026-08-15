package com.sportslobby.security;

import java.time.Duration;

public enum RateLimitPolicy {
    LOGIN_IP(30, Duration.ofMinutes(15)),
    LOGIN_ACCOUNT(5, Duration.ofMinutes(15)),
    PLAYER_SIGNUP_IP(10, Duration.ofHours(1)),
    VENDOR_SIGNUP_IP(5, Duration.ofHours(1)),
    SIGNUP_PHONE(3, Duration.ofHours(1)),
    OTP_REQUEST_IP(20, Duration.ofHours(1)),
    OTP_REQUEST_PHONE(5, Duration.ofHours(1)),
    OTP_VERIFY_IP(30, Duration.ofMinutes(15)),
    OTP_VERIFY_PHONE(10, Duration.ofMinutes(15)),
    PASSWORD_FORGOT_IP(10, Duration.ofHours(1)),
    PASSWORD_FORGOT_PHONE(3, Duration.ofHours(1)),
    PASSWORD_RESET_IP(10, Duration.ofMinutes(15)),
    PASSWORD_RESET_TOKEN(5, Duration.ofMinutes(15)),
    GOOGLE_IP(20, Duration.ofMinutes(15)),
    REFRESH_IP(120, Duration.ofMinutes(15));

    private final int limit;
    private final Duration window;

    RateLimitPolicy(int limit, Duration window) {
        this.limit = limit;
        this.window = window;
    }

    public int limit() {
        return limit;
    }

    public Duration window() {
        return window;
    }
}
