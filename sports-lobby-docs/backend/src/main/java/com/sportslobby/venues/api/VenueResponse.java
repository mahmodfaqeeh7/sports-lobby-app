package com.sportslobby.venues.api;

import com.sportslobby.venues.domain.Venue;
import java.math.BigDecimal;
import java.util.UUID;

public record VenueResponse(
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
    public static VenueResponse from(Venue venue) {
        return new VenueResponse(
            venue.id(),
            venue.vendorId(),
            venue.name(),
            venue.description(),
            venue.countryCode(),
            venue.city(),
            venue.area(),
            venue.addressLine(),
            venue.latitude(),
            venue.longitude(),
            venue.timezone(),
            venue.contactPhone(),
            venue.status()
        );
    }
}
