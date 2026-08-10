package com.sportslobby.reservations.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record Reservation(
    UUID id,
    UUID lobbyId,
    UUID userId,
    String status,
    int seatCount,
    BigDecimal unitPriceSnapshot,
    String currencyCodeSnapshot,
    Instant reservedAt,
    Instant cancelledAt,
    String cancellationActor,
    String cancellationReasonCode,
    String attendanceStatus
) {
}
