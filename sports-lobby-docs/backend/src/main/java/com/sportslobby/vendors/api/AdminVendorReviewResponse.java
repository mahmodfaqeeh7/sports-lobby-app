package com.sportslobby.vendors.api;

import com.sportslobby.auth.api.UserResponse;
import com.sportslobby.vendors.application.VendorService.AdminVendorReview;
import java.util.List;

public record AdminVendorReviewResponse(
    VendorResponse vendor,
    UserResponse owner,
    VerificationSubmissionResponse submission,
    List<AdminVerificationDocumentResponse> documents,
    boolean readyForDecision
) {
    public static AdminVendorReviewResponse from(AdminVendorReview review) {
        return new AdminVendorReviewResponse(
            VendorResponse.from(review.vendor()),
            UserResponse.from(review.owner()),
            VerificationSubmissionResponse.from(review.submission()),
            review.documents().stream().map(AdminVerificationDocumentResponse::from).toList(),
            review.readyForDecision()
        );
    }
}
