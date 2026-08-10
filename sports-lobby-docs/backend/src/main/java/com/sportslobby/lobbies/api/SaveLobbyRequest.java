package com.sportslobby.lobbies.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SaveLobbyRequest(
    @NotNull UUID venueId,
    @NotNull UUID courtId,
    @NotNull UUID sportId,
    @NotNull Instant startsAt,
    @NotNull Instant endsAt,
    @Positive int minPlayers,
    @Positive int maxPlayers,
    @NotBlank String pricingModel,
    @NotBlank @Size(min = 3, max = 3) String currencyCode,
    @NotNull @DecimalMin("0.00") BigDecimal priceAmount,
    @Size(max = 1000) String description,
    @NotNull Instant cancellationDeadlineAt,
    @NotNull Instant confirmationDeadlineAt
) {
}
