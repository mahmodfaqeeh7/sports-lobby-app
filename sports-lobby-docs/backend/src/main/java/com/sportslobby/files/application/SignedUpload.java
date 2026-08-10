package com.sportslobby.files.application;

import java.time.Instant;
import java.util.Map;

public record SignedUpload(
    String uploadUrl,
    String method,
    Map<String, String> headers,
    Instant expiresAt
) {
}
