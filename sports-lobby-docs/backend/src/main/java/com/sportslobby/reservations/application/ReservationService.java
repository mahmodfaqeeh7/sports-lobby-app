package com.sportslobby.reservations.application;

import com.sportslobby.auth.domain.UserRole;
import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiException;
import com.sportslobby.lobbies.domain.Lobby;
import com.sportslobby.lobbies.persistence.LobbyRepository;
import com.sportslobby.reservations.domain.Reservation;
import com.sportslobby.reservations.persistence.ReservationRepository;
import com.sportslobby.security.AuthenticatedUser;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final LobbyRepository lobbyRepository;
    private final Clock clock;

    public ReservationService(ReservationRepository reservationRepository, LobbyRepository lobbyRepository, Clock clock) {
        this.reservationRepository = reservationRepository;
        this.lobbyRepository = lobbyRepository;
        this.clock = clock;
    }

    @Transactional
    public Reservation join(UUID lobbyId, AuthenticatedUser user) {
        requirePlayer(user);
        if (!user.phoneVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "Phone verification is required before reserving.");
        }

        Lobby lobby = lobbyRepository.findById(lobbyId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Lobby not found."));
        if (!"OPEN".equals(lobby.status()) && !"FULL".equals(lobby.status())) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.LOBBY_NOT_JOINABLE, "Lobby is not joinable.");
        }
        if (!lobby.startsAt().isAfter(Instant.now(clock))) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.LOBBY_NOT_JOINABLE, "Lobby has already started.");
        }
        if (reservationRepository.hasActiveReservation(lobbyId, user.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.ALREADY_RESERVED, "User already reserved this lobby.");
        }
        if (!lobbyRepository.tryReserveSeat(lobbyId)) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.LOBBY_FULL, "No seats are currently available.");
        }

        Instant now = Instant.now(clock);
        Reservation reservation = new Reservation(
            UUID.randomUUID(),
            lobbyId,
            user.userId(),
            "RESERVED",
            1,
            lobby.pricePerSeat(),
            lobby.currencyCode(),
            now,
            null,
            null,
            null,
            "UNKNOWN"
        );
        try {
            reservationRepository.create(reservation);
        } catch (DuplicateKeyException exception) {
            lobbyRepository.releaseSeat(lobbyId);
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.ALREADY_RESERVED, "User already reserved this lobby.");
        }
        return reservation;
    }

    @Transactional
    public Reservation cancel(UUID reservationId, AuthenticatedUser user, String reasonCode) {
        requirePlayer(user);
        Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Reservation not found."));
        if (!reservation.userId().equals(user.userId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Reservation not found.");
        }
        boolean cancelled = reservationRepository.cancelActive(
            reservationId,
            user.userId(),
            Instant.now(clock),
            "USER",
            reasonCode == null || reasonCode.isBlank() ? "USER_REQUEST" : reasonCode.trim()
        );
        if (cancelled) {
            lobbyRepository.releaseSeat(reservation.lobbyId());
        }
        return reservationRepository.findById(reservationId).orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<Reservation> myReservations(AuthenticatedUser user) {
        requirePlayer(user);
        return reservationRepository.findByUserId(user.userId());
    }

    private void requirePlayer(AuthenticatedUser user) {
        if (user == null || !user.roles().contains(UserRole.PLAYER)) {
            throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "Player role is required.");
        }
    }
}
