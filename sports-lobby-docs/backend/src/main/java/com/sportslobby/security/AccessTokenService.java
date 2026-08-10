package com.sportslobby.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportslobby.auth.application.AuthProperties;
import com.sportslobby.auth.domain.UserAccount;
import com.sportslobby.auth.domain.UserRole;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class AccessTokenService {
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final AuthProperties authProperties;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public AccessTokenService(AuthProperties authProperties, ObjectMapper objectMapper, Clock clock) {
        this.authProperties = authProperties;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    public IssuedAccessToken issue(UserAccount user) {
        Instant now = Instant.now(clock);
        Instant expiresAt = now.plus(authProperties.accessTokenTtl());
        Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
        Map<String, Object> payload = Map.of(
            "sub", user.id().toString(),
            "roles", user.roles().stream().map(UserRole::name).sorted().toList(),
            "phoneVerified", user.isPhoneVerified(),
            "iat", now.getEpochSecond(),
            "exp", expiresAt.getEpochSecond(),
            "jti", UUID.randomUUID().toString()
        );
        return new IssuedAccessToken(sign(header, payload), expiresAt);
    }

    public AuthenticatedUser verify(String token) {
        String[] segments = token.split("\\.");
        if (segments.length != 3) {
            throw new InvalidAccessTokenException();
        }

        String signedContent = segments[0] + "." + segments[1];
        byte[] expectedSignature = hmacSha256(signedContent);
        byte[] actualSignature;
        try {
            actualSignature = URL_DECODER.decode(segments[2]);
        } catch (IllegalArgumentException exception) {
            throw new InvalidAccessTokenException();
        }

        if (!MessageDigest.isEqual(expectedSignature, actualSignature)) {
            throw new InvalidAccessTokenException();
        }

        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(URL_DECODER.decode(segments[1]), MAP_TYPE);
        } catch (Exception exception) {
            throw new InvalidAccessTokenException();
        }

        long expiresAt = numberClaim(payload, "exp");
        if (Instant.ofEpochSecond(expiresAt).isBefore(Instant.now(clock))) {
            throw new InvalidAccessTokenException();
        }

        try {
            UUID userId = UUID.fromString((String) payload.get("sub"));
            boolean phoneVerified = Boolean.TRUE.equals(payload.get("phoneVerified"));
            @SuppressWarnings("unchecked")
            List<String> rolesClaim = (List<String>) payload.getOrDefault("roles", List.of());
            Set<UserRole> roles = rolesClaim.stream().map(UserRole::valueOf).collect(Collectors.toUnmodifiableSet());
            return new AuthenticatedUser(userId, roles, phoneVerified);
        } catch (RuntimeException exception) {
            throw new InvalidAccessTokenException();
        }
    }

    private String sign(Map<String, Object> header, Map<String, Object> payload) {
        try {
            String headerSegment = URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(header));
            String payloadSegment = URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(payload));
            String signedContent = headerSegment + "." + payloadSegment;
            String signatureSegment = URL_ENCODER.encodeToString(hmacSha256(signedContent));
            return signedContent + "." + signatureSegment;
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize access token.", exception);
        }
    }

    private byte[] hmacSha256(String input) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                authProperties.accessTokenSecret().getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
            ));
            return mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign access token.", exception);
        }
    }

    private long numberClaim(Map<String, Object> payload, String name) {
        Object value = payload.get(name);
        if (value instanceof Number number) {
            return number.longValue();
        }
        throw new InvalidAccessTokenException();
    }

    public record IssuedAccessToken(String token, Instant expiresAt) {
    }

    public static class InvalidAccessTokenException extends RuntimeException {
    }
}
