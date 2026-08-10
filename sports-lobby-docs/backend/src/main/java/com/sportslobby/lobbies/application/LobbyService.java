package com.sportslobby.lobbies.application;

import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiException;
import com.sportslobby.courts.persistence.CourtRepository;
import com.sportslobby.lobbies.api.SaveLobbyRequest;
import com.sportslobby.lobbies.domain.Lobby;
import com.sportslobby.lobbies.persistence.LobbyRepository;
import com.sportslobby.security.AuthenticatedUser;
import com.sportslobby.venues.domain.Venue;
import com.sportslobby.venues.persistence.VenueRepository;
import com.sportslobby.vendors.application.VendorPublishingGuard;
import com.sportslobby.vendors.application.VendorService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LobbyService {
    private final LobbyRepository lobbyRepository;
    private final VenueRepository venueRepository;
    private final CourtRepository courtRepository;
    private final VendorService vendorService;
    private final VendorPublishingGuard vendorPublishingGuard;
    private final Clock clock;

    public LobbyService(
        LobbyRepository lobbyRepository,
        VenueRepository venueRepository,
        CourtRepository courtRepository,
        VendorService vendorService,
        VendorPublishingGuard vendorPublishingGuard,
        Clock clock
    ) {
        this.lobbyRepository = lobbyRepository;
        this.venueRepository = venueRepository;
        this.courtRepository = courtRepository;
        this.vendorService = vendorService;
        this.vendorPublishingGuard = vendorPublishingGuard;
        this.clock = clock;
    }

    @Transactional
    public Lobby createDraft(AuthenticatedUser user, SaveLobbyRequest request) {
        var vendor = vendorService.getMyVendor(user);
        Venue venue = requireOwnedVenue(vendor.id(), request.venueId());
        requireValidLobbyResources(venue, request);
        Lobby lobby = buildLobby(UUID.randomUUID(), vendor.id(), venue, "DRAFT", request, 0, null);
        lobbyRepository.create(lobby);
        return lobby;
    }

    @Transactional
    public Lobby editDraft(AuthenticatedUser user, UUID lobbyId, SaveLobbyRequest request) {
        var vendor = vendorService.getMyVendor(user);
        Lobby existing = requireOwnedLobby(vendor.id(), lobbyId);
        if (!"DRAFT".equals(existing.status())) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Only draft lobbies can be edited.");
        }
        Venue venue = requireOwnedVenue(vendor.id(), request.venueId());
        requireValidLobbyResources(venue, request);
        Lobby updated = buildLobby(lobbyId, vendor.id(), venue, "DRAFT", request, existing.reservedSeatCount(), existing.publishedAt());
        lobbyRepository.updateDraft(updated);
        return lobbyRepository.findById(lobbyId).orElseThrow();
    }

    @Transactional
    public Lobby publish(AuthenticatedUser user, UUID lobbyId) {
        var vendor = vendorService.getMyVendor(user);
        vendorPublishingGuard.requireCanPublish(vendor.id());
        Lobby lobby = requireOwnedLobby(vendor.id(), lobbyId);
        if (!"DRAFT".equals(lobby.status())) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Only draft lobbies can be published.");
        }
        Venue venue = requireOwnedVenue(vendor.id(), lobby.venueId());
        if (!"ACTIVE".equals(venue.status())) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Venue must be active before publishing.");
        }
        var court = courtRepository.findById(lobby.courtId())
            .orElseThrow(() -> notFound("Court not found."));
        if (!court.venueId().equals(venue.id()) || !"ACTIVE".equals(court.status())) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Court must be active and belong to the venue.");
        }
        if (!courtRepository.supportsSport(lobby.courtId(), lobby.sportId())) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Court does not support this sport.");
        }
        if (lobby.startsAt().isBefore(Instant.now(clock))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Lobby start time must be in the future.");
        }
        if (lobbyRepository.hasCourtOverlap(lobby.courtId(), lobby.startsAt(), lobby.endsAt(), lobby.id())) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Court already has an overlapping lobby.");
        }
        lobbyRepository.publish(lobby.id(), Instant.now(clock));
        return lobbyRepository.findById(lobby.id()).orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<Lobby> listVendorLobbies(AuthenticatedUser user) {
        var vendor = vendorService.getMyVendor(user);
        return lobbyRepository.findByVendorId(vendor.id());
    }

    @Transactional(readOnly = true)
    public List<Lobby> discover(UUID sportId, String city, Instant from, Instant to) {
        return lobbyRepository.discover(sportId, city, from, to);
    }

    private void requireValidLobbyResources(Venue venue, SaveLobbyRequest request) {
        if (request.maxPlayers() < request.minPlayers()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "maxPlayers must be greater than or equal to minPlayers.");
        }
        if (!request.endsAt().isAfter(request.startsAt())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Lobby end time must be after start time.");
        }
        if (request.cancellationDeadlineAt().isAfter(request.startsAt()) || request.confirmationDeadlineAt().isAfter(request.startsAt())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Deadlines must be at or before lobby start.");
        }
        var court = courtRepository.findById(request.courtId()).orElseThrow(() -> notFound("Court not found."));
        if (!court.venueId().equals(venue.id())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Court must belong to the selected venue.");
        }
        if (!courtRepository.supportsSport(request.courtId(), request.sportId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Court does not support this sport.");
        }
    }

    private Lobby buildLobby(
        UUID lobbyId,
        UUID vendorId,
        Venue venue,
        String status,
        SaveLobbyRequest request,
        int reservedSeatCount,
        Instant publishedAt
    ) {
        String pricingModel = request.pricingModel().trim().toUpperCase(Locale.ROOT);
        BigDecimal totalCourtPrice = null;
        BigDecimal pricePerSeat;
        if ("TOTAL_COURT_PRICE".equals(pricingModel)) {
            totalCourtPrice = request.priceAmount().setScale(2, RoundingMode.HALF_UP);
            pricePerSeat = totalCourtPrice.divide(BigDecimal.valueOf(request.maxPlayers()), 2, RoundingMode.HALF_UP);
        } else if ("PRICE_PER_PLAYER".equals(pricingModel)) {
            pricePerSeat = request.priceAmount().setScale(2, RoundingMode.HALF_UP);
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Unsupported pricing model.");
        }
        return new Lobby(
            lobbyId,
            vendorId,
            venue.id(),
            request.courtId(),
            request.sportId(),
            status,
            request.startsAt(),
            request.endsAt(),
            venue.timezone(),
            request.minPlayers(),
            request.maxPlayers(),
            reservedSeatCount,
            pricingModel,
            request.currencyCode().trim().toUpperCase(Locale.ROOT),
            totalCourtPrice,
            pricePerSeat,
            request.description() == null || request.description().isBlank() ? null : request.description().trim(),
            request.cancellationDeadlineAt(),
            request.confirmationDeadlineAt(),
            publishedAt
        );
    }

    private Venue requireOwnedVenue(UUID vendorId, UUID venueId) {
        Venue venue = venueRepository.findById(venueId).orElseThrow(() -> notFound("Venue not found."));
        if (!venue.vendorId().equals(vendorId)) {
            throw notFound("Venue not found.");
        }
        return venue;
    }

    private Lobby requireOwnedLobby(UUID vendorId, UUID lobbyId) {
        Lobby lobby = lobbyRepository.findById(lobbyId).orElseThrow(() -> notFound("Lobby not found."));
        if (!lobby.vendorId().equals(vendorId)) {
            throw notFound("Lobby not found.");
        }
        return lobby;
    }

    private ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, message);
    }
}
