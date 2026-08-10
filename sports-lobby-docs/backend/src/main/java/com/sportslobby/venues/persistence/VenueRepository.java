package com.sportslobby.venues.persistence;

import com.sportslobby.venues.domain.Venue;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VenueRepository {
    void create(Venue venue);

    List<Venue> findByVendorId(UUID vendorId);

    Optional<Venue> findById(UUID venueId);
}
