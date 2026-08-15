package com.sportslobby.vendors.api;

import com.sportslobby.vendors.domain.Vendor;
import java.time.Instant;
import java.util.UUID;

public record VendorResponse(
    UUID id,
    UUID ownerUserId,
    String businessName,
    String contactPhone,
    String contactEmail,
    String countryCode,
    String city,
    String area,
    String addressLine,
    String supportedSports,
    Integer venueCountEstimate,
    String openingHours,
    String verificationStatus,
    String statusReason,
    Instant approvedAt,
    Instant suspendedAt
) {
    public static VendorResponse from(Vendor vendor) {
        return new VendorResponse(
            vendor.id(),
            vendor.ownerUserId(),
            vendor.businessName(),
            vendor.contactPhone(),
            vendor.contactEmail(),
            vendor.countryCode(),
            vendor.city(),
            vendor.area(),
            vendor.addressLine(),
            vendor.supportedSports(),
            vendor.venueCountEstimate(),
            vendor.openingHours(),
            vendor.verificationStatus().name(),
            vendor.statusReason(),
            vendor.approvedAt(),
            vendor.suspendedAt()
        );
    }
}
