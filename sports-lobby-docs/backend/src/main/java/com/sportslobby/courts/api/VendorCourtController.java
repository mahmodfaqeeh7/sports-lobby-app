package com.sportslobby.courts.api;

import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiException;
import com.sportslobby.courts.domain.Court;
import com.sportslobby.courts.application.CourtImageService;
import com.sportslobby.courts.persistence.CourtRepository;
import com.sportslobby.security.AuthenticatedUser;
import com.sportslobby.sports.persistence.SportRepository;
import com.sportslobby.venues.persistence.VenueRepository;
import com.sportslobby.vendors.application.VendorService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vendor/venues/{venueId}/courts")
public class VendorCourtController {
    private final VendorService vendorService;
    private final VenueRepository venueRepository;
    private final CourtRepository courtRepository;
    private final SportRepository sportRepository;
    private final CourtImageService courtImageService;

    public VendorCourtController(
        VendorService vendorService,
        VenueRepository venueRepository,
        CourtRepository courtRepository,
        SportRepository sportRepository,
        CourtImageService courtImageService
    ) {
        this.vendorService = vendorService;
        this.venueRepository = venueRepository;
        this.courtRepository = courtRepository;
        this.sportRepository = sportRepository;
        this.courtImageService = courtImageService;
    }

    @PostMapping
    public CourtResponse create(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable UUID venueId,
        @Valid @RequestBody CreateCourtRequest request
    ) {
        var vendor = vendorService.getMyVendor(user);
        var venue = venueRepository.findById(venueId)
            .orElseThrow(() -> notFound("Venue not found."));
        if (!venue.vendorId().equals(vendor.id())) {
            throw notFound("Venue not found.");
        }
        if (request.defaultMinPlayers() != null && request.defaultMaxPlayers() != null
            && request.defaultMaxPlayers() < request.defaultMinPlayers()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Court max players must be >= min players.");
        }
        request.sportIds().forEach(sportId -> sportRepository.findActiveById(sportId)
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Sport is not active.")));
        courtImageService.requireUsableImage(request.imageFileId(), vendor.id());

        Court court = new Court(
            UUID.randomUUID(),
            venueId,
            request.name().trim(),
            request.description() == null || request.description().isBlank() ? null : request.description().trim(),
            "ACTIVE",
            request.defaultMinPlayers(),
            request.defaultMaxPlayers(),
            request.imageFileId(),
            request.sportIds()
        );
        courtRepository.create(court);
        return response(court);
    }

    @GetMapping
    public List<CourtResponse> list(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID venueId) {
        var vendor = vendorService.getMyVendor(user);
        var venue = venueRepository.findById(venueId).orElseThrow(() -> notFound("Venue not found."));
        if (!venue.vendorId().equals(vendor.id())) {
            throw notFound("Venue not found.");
        }
        return courtRepository.findByVenueId(venueId).stream().map(this::response).toList();
    }

    private CourtResponse response(Court court) {
        var image = courtImageService.createDisplayUrl(court.imageFileId());
        return CourtResponse.from(
            court,
            image.map(download -> download.downloadUrl()).orElse(null),
            image.map(download -> download.expiresAt()).orElse(null)
        );
    }

    private ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, message);
    }
}
