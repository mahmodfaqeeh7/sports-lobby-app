package com.sportslobby.venues.domain;

import java.math.BigDecimal;
import java.util.UUID;

public record Venue(
    UUID id,
    UUID vendorId,
    String name,
    String description,
    String countryCode,
    String city,
    String area,
    String addressLine,
    BigDecimal latitude,
    BigDecimal longitude,
    String timezone,
    String contactPhone,
    String status
) {
}
