package com.sportslobby.vendors.api;

import com.sportslobby.auth.api.TokenResponse;
import com.sportslobby.auth.api.UserResponse;
import com.sportslobby.vendors.application.VendorService.VendorSignupResult;
import java.util.List;

public record VendorSignupResponse(
    UserResponse user,
    TokenResponse tokens,
    VendorResponse vendor,
    VerificationSubmissionResponse verificationSubmission,
    List<DocumentUploadResponse> documentUploads
) {
    public static VendorSignupResponse from(VendorSignupResult result) {
        return new VendorSignupResponse(
            UserResponse.from(result.user()),
            TokenResponse.from(result.tokens()),
            VendorResponse.from(result.vendor()),
            VerificationSubmissionResponse.from(result.submission()),
            result.documentUploads()
        );
    }
}
