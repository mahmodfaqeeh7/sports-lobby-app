package com.sportslobby.vendors.api;

import com.sportslobby.vendors.domain.VerificationDocumentType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;

public record VendorSignupRequest(
    @NotBlank @Size(max = 100) String firstName,
    @NotBlank @Size(max = 100) String lastName,
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Pattern(regexp = "^\\+[1-9][0-9]{7,14}$") String phoneE164,
    @NotBlank @Size(min = 8, max = 200) String password,
    @Size(max = 200) String deviceLabel,
    @NotBlank @Size(max = 180) String businessName,
    @NotBlank @Pattern(regexp = "^\\+[1-9][0-9]{7,14}$") String contactPhone,
    @NotBlank @Email @Size(max = 255) String contactEmail,
    @NotBlank @Pattern(regexp = "^[A-Z]{2}$") String countryCode,
    @NotBlank @Size(max = 120) String city,
    @Size(max = 120) String area,
    @NotBlank @Size(max = 255) String addressLine,
    @Size(max = 1000) String supportedSports,
    @PositiveOrZero Integer venueCountEstimate,
    @Size(max = 2000) String openingHours,
    @NotEmpty @Size(max = 10) List<@Valid VerificationDocumentRequest> verificationDocuments,
    @AssertTrue Boolean acceptedTerms,
    @AssertTrue Boolean acceptedPrivacy
) {
    public record VerificationDocumentRequest(
        @NotNull VerificationDocumentType documentType,
        @NotBlank @Size(max = 255) String fileName,
        @NotBlank @Size(max = 120) String contentType,
        @Positive long sizeBytes
    ) {
    }
}
