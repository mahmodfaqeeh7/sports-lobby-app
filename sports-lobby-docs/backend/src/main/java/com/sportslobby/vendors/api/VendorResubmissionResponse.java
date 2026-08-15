package com.sportslobby.vendors.api;

import com.sportslobby.vendors.application.VendorService.VendorResubmissionResult;
import java.util.List;

public record VendorResubmissionResponse(
    VendorResponse vendor,
    VerificationSubmissionResponse verificationSubmission,
    List<DocumentUploadResponse> documentUploads
) {
    public static VendorResubmissionResponse from(VendorResubmissionResult result) {
        return new VendorResubmissionResponse(
            VendorResponse.from(result.vendor()),
            VerificationSubmissionResponse.from(result.submission()),
            result.documentUploads()
        );
    }
}
