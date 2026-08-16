package com.sportslobby.courts.api;

import com.sportslobby.files.application.SignedUpload;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record CourtImageUploadResponse(
    UUID fileId,
    String uploadUrl,
    String method,
    Map<String, String> headers,
    Instant expiresAt
) {
    public static CourtImageUploadResponse from(UUID fileId, SignedUpload upload) {
        return new CourtImageUploadResponse(
            fileId,
            upload.uploadUrl(),
            upload.method(),
            upload.headers(),
            upload.expiresAt()
        );
    }
}
