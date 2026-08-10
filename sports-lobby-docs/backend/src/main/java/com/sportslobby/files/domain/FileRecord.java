package com.sportslobby.files.domain;

import java.time.Instant;
import java.util.UUID;

public record FileRecord(
    UUID id,
    UUID ownerUserId,
    UUID ownerVendorId,
    FilePurpose purpose,
    String storageProvider,
    String bucketName,
    String objectKey,
    String originalFileName,
    String contentType,
    long sizeBytes,
    FileAccessLevel accessLevel,
    FileUploadStatus uploadStatus,
    Instant createdAt,
    Instant updatedAt
) {
}
