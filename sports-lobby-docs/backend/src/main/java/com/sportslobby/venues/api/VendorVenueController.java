package com.sportslobby.venues.api;

import com.sportslobby.security.AuthenticatedUser;
import com.sportslobby.venues.domain.Venue;
import com.sportslobby.venues.persistence.VenueRepository;
import com.sportslobby.vendors.application.VendorService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vendor/venues")
public class VendorVenueController {
    private final VendorService vendorService;
    private final VenueRepository venueRepository;

    public VendorVenueController(VendorService vendorService, VenueRepository venueRepository) {
        this.vendorService = vendorService;
        this.venueRepository = venueRepository;
    }

    @PostMapping
    public VenueResponse create(@AuthenticationPrincipal AuthenticatedUser user, @Valid @RequestBody CreateVenueRequest request) {
        var vendor = vendorService.getMyVendor(user);
        Venue venue = new Venue(
            UUID.randomUUID(),
            vendor.id(),
            request.name().trim(),
            normalizeOptional(request.description()),
            request.countryCode().trim(),
            request.city().trim(),
            normalizeOptional(request.area()),
            request.addressLine().trim(),
            request.latitude(),
            request.longitude(),
            request.timezone().trim(),
            request.contactPhone().trim(),
            "ACTIVE"
        );
        venueRepository.create(venue);
        return VenueResponse.from(venue);
    }

    @GetMapping
    public List<VenueResponse> list(@AuthenticationPrincipal AuthenticatedUser user) {
        var vendor = vendorService.getMyVendor(user);
        return venueRepository.findByVendorId(vendor.id()).stream().map(VenueResponse::from).toList();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
