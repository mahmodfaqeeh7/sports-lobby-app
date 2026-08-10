package com.sportslobby.lobbies.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record Lobby(
    UUID id,
    UUID vendorId,
    UUID venueId,
    UUID courtId,
    UUID sportId,
    String status,
    Instant startsAt,
    Instant endsAt,
    String venueTimezoneSnapshot,
    int minPlayers,
    int maxPlayers,
    int reservedSeatCount,
    String pricingModel,
    String currencyCode,
    BigDecimal totalCourtPrice,
    BigDecimal pricePerSeat,
    String description,
    Instant cancellationDeadlineAt,
    Instant confirmationDeadlineAt,
    Instant publishedAt
) {
    public int availableSeats() {
        return maxPlayers - reservedSeatCount;
    }
}
