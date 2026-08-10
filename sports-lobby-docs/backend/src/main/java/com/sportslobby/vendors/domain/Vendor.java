package com.sportslobby.vendors.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record Vendor(
    UUID id,
    UUID ownerUserId,
    String businessName,
    String contactPhone,
    String contactEmail,
    String countryCode,
    String city,
    String area,
    String addressLine,
    BigDecimal latitude,
    BigDecimal longitude,
    String supportedSports,
    Integer venueCountEstimate,
    String openingHours,
    VerificationStatus verificationStatus,
    Instant approvedAt,
    Instant suspendedAt,
    Instant createdAt,
    Instant updatedAt
) {
}
