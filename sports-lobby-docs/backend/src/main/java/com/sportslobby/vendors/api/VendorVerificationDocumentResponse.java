package com.sportslobby.vendors.api;

import com.sportslobby.files.domain.FileUploadStatus;
import com.sportslobby.vendors.domain.VerificationDocumentFile;
import java.time.Instant;
import java.util.UUID;

public record VendorVerificationDocumentResponse(
    UUID id,
    UUID fileId,
    String documentType,
    String fileName,
    String contentType,
    long sizeBytes,
    String uploadStatus,
    Instant uploadedAt
) {
    public static VendorVerificationDocumentResponse from(VerificationDocumentFile document) {
        return new VendorVerificationDocumentResponse(
            document.id(),
            document.file().id(),
            document.documentType().name(),
            document.file().originalFileName(),
            document.file().contentType(),
            document.file().sizeBytes(),
            document.file().uploadStatus().name(),
            document.file().uploadStatus() == FileUploadStatus.UPLOADED ? document.file().updatedAt() : null
        );
    }
}
