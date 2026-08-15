package com.sportslobby.security;

import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiException;
import org.springframework.http.HttpStatus;

public class RateLimitExceededException extends ApiException {
    private final long retryAfterSeconds;

    public RateLimitExceededException(long retryAfterSeconds) {
        super(
            HttpStatus.TOO_MANY_REQUESTS,
            ApiErrorCode.RATE_LIMITED,
            "Too many requests. Try again later."
        );
        this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
    }

    public long retryAfterSeconds() {
        return retryAfterSeconds;
    }
}
