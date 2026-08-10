package com.sportslobby.vendors.api;

import com.sportslobby.files.application.SignedUpload;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record DocumentUploadResponse(
    UUID fileId,
    String documentType,
    String objectKey,
    String uploadUrl,
    String method,
    Map<String, String> headers,
    Instant expiresAt
) {
    public static DocumentUploadResponse from(UUID fileId, String documentType, String objectKey, SignedUpload upload) {
        return new DocumentUploadResponse(
            fileId,
            documentType,
            objectKey,
            upload.uploadUrl(),
            upload.method(),
            upload.headers(),
            upload.expiresAt()
        );
    }
}
