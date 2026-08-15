package com.sportslobby.vendors.domain;

import com.sportslobby.files.domain.FileRecord;
import java.time.Instant;
import java.util.UUID;

public record VerificationDocumentFile(
    UUID id,
    UUID submissionId,
    VerificationDocumentType documentType,
    FileRecord file,
    Instant createdAt
) {
}
