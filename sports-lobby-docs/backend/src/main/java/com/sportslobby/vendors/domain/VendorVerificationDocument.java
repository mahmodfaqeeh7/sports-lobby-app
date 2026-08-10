package com.sportslobby.vendors.domain;

import java.time.Instant;
import java.util.UUID;

public record VendorVerificationDocument(
    UUID id,
    UUID submissionId,
    UUID fileId,
    VerificationDocumentType documentType,
    Instant createdAt
) {
}
