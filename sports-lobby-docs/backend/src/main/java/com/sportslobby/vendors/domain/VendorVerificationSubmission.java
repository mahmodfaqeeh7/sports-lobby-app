package com.sportslobby.vendors.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record VendorVerificationSubmission(
    UUID id,
    UUID vendorId,
    SubmissionStatus status,
    Instant submittedAt,
    Instant reviewedAt,
    UUID reviewedByAdminUserId,
    String decisionReason,
    int submissionNumber,
    String businessNameSnapshot,
    String contactPhoneSnapshot,
    String contactEmailSnapshot,
    String countryCodeSnapshot,
    String citySnapshot,
    String areaSnapshot,
    String addressLineSnapshot,
    BigDecimal latitudeSnapshot,
    BigDecimal longitudeSnapshot,
    String supportedSportsSnapshot,
    Integer venueCountEstimateSnapshot,
    String openingHoursSnapshot,
    Instant createdAt,
    Instant updatedAt
) {
}
