package com.sportslobby.vendors.api;

import com.sportslobby.vendors.application.VendorService.VendorKycResult;
import java.util.List;

public record VendorKycResponse(
    VendorResponse vendor,
    VerificationSubmissionResponse latestSubmission,
    List<VendorVerificationDocumentResponse> documents
) {
    public static VendorKycResponse from(VendorKycResult result) {
        return new VendorKycResponse(
            VendorResponse.from(result.vendor()),
            VerificationSubmissionResponse.from(result.latestSubmission()),
            result.documents().stream().map(VendorVerificationDocumentResponse::from).toList()
        );
    }
}
