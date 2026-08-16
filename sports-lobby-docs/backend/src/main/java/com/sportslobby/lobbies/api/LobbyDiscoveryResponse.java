package com.sportslobby.lobbies.api;

import com.sportslobby.files.application.SignedDownload;
import com.sportslobby.lobbies.domain.LobbyDiscoveryItem;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record LobbyDiscoveryResponse(
    UUID id,
    UUID vendorId,
    UUID venueId,
    String venueName,
    String venueCity,
    String venueArea,
    String venueAddress,
    UUID courtId,
    String courtName,
    String courtImageUrl,
    Instant courtImageUrlExpiresAt,
    UUID sportId,
    String sportCode,
    String sportName,
    String status,
    Instant startsAt,
    Instant endsAt,
    String venueTimezone,
    int minPlayers,
    int maxPlayers,
    int reservedPlayers,
    int availableSeats,
    String pricingModel,
    String currencyCode,
    BigDecimal totalCourtPrice,
    BigDecimal pricePerSeat,
    String description,
    Instant cancellationDeadlineAt,
    Instant confirmationDeadlineAt,
    Instant publishedAt
) {
    public static LobbyDiscoveryResponse from(LobbyDiscoveryItem item, SignedDownload image) {
        var lobby = item.lobby();
        return new LobbyDiscoveryResponse(
            lobby.id(),
            lobby.vendorId(),
            lobby.venueId(),
            item.venueName(),
            item.venueCity(),
            item.venueArea(),
            item.venueAddress(),
            lobby.courtId(),
            item.courtName(),
            image == null ? null : image.downloadUrl(),
            image == null ? null : image.expiresAt(),
            lobby.sportId(),
            item.sportCode(),
            item.sportName(),
            lobby.status(),
            lobby.startsAt(),
            lobby.endsAt(),
            lobby.venueTimezoneSnapshot(),
            lobby.minPlayers(),
            lobby.maxPlayers(),
            lobby.reservedSeatCount(),
            lobby.availableSeats(),
            lobby.pricingModel(),
            lobby.currencyCode(),
            lobby.totalCourtPrice(),
            lobby.pricePerSeat(),
            lobby.description(),
            lobby.cancellationDeadlineAt(),
            lobby.confirmationDeadlineAt(),
            lobby.publishedAt()
        );
    }
}
