package com.sportslobby.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.rate-limit")
public record RateLimitProperties(boolean enabled, long maxTrackedKeys) {
    public RateLimitProperties {
        if (maxTrackedKeys <= 0) {
            maxTrackedKeys = 100_000;
        }
    }
}
