package com.sportslobby.reservations.persistence;

import com.sportslobby.reservations.domain.Reservation;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReservationRepository {
    boolean hasActiveReservation(UUID lobbyId, UUID userId);

    boolean createIfAbsent(Reservation reservation);

    Optional<Reservation> findById(UUID reservationId);

    List<Reservation> findByUserId(UUID userId);

    boolean cancelActive(UUID reservationId, UUID userId, Instant cancelledAt, String actor, String reasonCode);
}
