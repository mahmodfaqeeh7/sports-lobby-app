package com.sportslobby.reservations.api;

import com.sportslobby.reservations.domain.Reservation;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ReservationResponse(
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
    public static ReservationResponse from(Reservation reservation) {
        return new ReservationResponse(
            reservation.id(),
            reservation.lobbyId(),
            reservation.userId(),
            reservation.status(),
            reservation.seatCount(),
            reservation.unitPriceSnapshot(),
            reservation.currencyCodeSnapshot(),
            reservation.reservedAt(),
            reservation.cancelledAt(),
            reservation.cancellationActor(),
            reservation.cancellationReasonCode(),
            reservation.attendanceStatus()
        );
    }
}
