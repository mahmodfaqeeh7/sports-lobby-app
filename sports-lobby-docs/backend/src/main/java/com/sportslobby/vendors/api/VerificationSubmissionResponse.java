package com.sportslobby.vendors.api;

import com.sportslobby.vendors.domain.VendorVerificationSubmission;
import java.time.Instant;
import java.util.UUID;

public record VerificationSubmissionResponse(
    UUID id,
    UUID vendorId,
    String status,
    int submissionNumber,
    Instant submittedAt,
    Instant reviewedAt,
    UUID reviewedByAdminUserId,
    String decisionReason
) {
    public static VerificationSubmissionResponse from(VendorVerificationSubmission submission) {
        return new VerificationSubmissionResponse(
            submission.id(),
            submission.vendorId(),
            submission.status().name(),
            submission.submissionNumber(),
            submission.submittedAt(),
            submission.reviewedAt(),
            submission.reviewedByAdminUserId(),
            submission.decisionReason()
        );
    }
}
