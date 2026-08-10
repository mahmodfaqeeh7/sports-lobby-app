package com.sportslobby.lobbies.api;

import com.sportslobby.lobbies.domain.Lobby;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record LobbyResponse(
    UUID id,
    UUID vendorId,
    UUID venueId,
    UUID courtId,
    UUID sportId,
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
    public static LobbyResponse from(Lobby lobby) {
        return new LobbyResponse(
            lobby.id(),
            lobby.vendorId(),
            lobby.venueId(),
            lobby.courtId(),
            lobby.sportId(),
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
