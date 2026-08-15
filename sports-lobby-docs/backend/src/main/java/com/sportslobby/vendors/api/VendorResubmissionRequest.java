package com.sportslobby.vendors.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import com.sportslobby.vendors.api.VendorSignupRequest.VerificationDocumentRequest;

public record VendorResubmissionRequest(
    @NotEmpty @Size(max = 10)
    List<@Valid VerificationDocumentRequest> verificationDocuments
) {
}
