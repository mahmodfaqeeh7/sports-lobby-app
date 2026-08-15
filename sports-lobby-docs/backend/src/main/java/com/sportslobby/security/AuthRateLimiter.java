package com.sportslobby.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

@Component
public class AuthRateLimiter {
    private final RateLimitProperties properties;
    private final Clock clock;
    private final Cache<String, WindowCounter> counters;

    public AuthRateLimiter(RateLimitProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
        this.counters = Caffeine.newBuilder()
            .maximumSize(properties.maxTrackedKeys())
            .expireAfterAccess(2, TimeUnit.HOURS)
            .build();
    }

    public void check(RateLimitPolicy policy, String identifier) {
        if (!properties.enabled()) {
            return;
        }
        Instant now = clock.instant();
        String key = policy.name() + ":" + sha256(identifier == null ? "unknown" : identifier.trim().toLowerCase());
        WindowCounter counter = counters.get(key, ignored -> new WindowCounter(now.plus(policy.window())));
        synchronized (counter) {
            if (!counter.windowEndsAt.isAfter(now)) {
                counter.count = 0;
                counter.windowEndsAt = now.plus(policy.window());
            }
            if (counter.count >= policy.limit()) {
                throw new RateLimitExceededException(counter.windowEndsAt.getEpochSecond() - now.getEpochSecond());
            }
            counter.count += 1;
        }
    }

    public void reset(RateLimitPolicy policy, String identifier) {
        if (identifier != null) {
            counters.invalidate(policy.name() + ":" + sha256(identifier.trim().toLowerCase()));
        }
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable.", exception);
        }
    }

    private static final class WindowCounter {
        private int count;
        private Instant windowEndsAt;

        private WindowCounter(Instant windowEndsAt) {
            this.windowEndsAt = windowEndsAt;
        }
    }
}
