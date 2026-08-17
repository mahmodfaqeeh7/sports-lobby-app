package com.sportslobby.reservations.application;

import com.sportslobby.auth.domain.UserAccount;
import com.sportslobby.auth.domain.UserRole;
import com.sportslobby.auth.domain.UserStatus;
import com.sportslobby.auth.persistence.AuthRepository;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final LobbyRepository lobbyRepository;
    private final AuthRepository authRepository;
    private final Clock clock;

    public ReservationService(
        ReservationRepository reservationRepository,
        LobbyRepository lobbyRepository,
        AuthRepository authRepository,
        Clock clock
    ) {
        this.reservationRepository = reservationRepository;
        this.lobbyRepository = lobbyRepository;
        this.authRepository = authRepository;
        this.clock = clock;
    }

    @Transactional
    public Reservation join(UUID lobbyId, AuthenticatedUser user) {
        requireReservationEligibility(user);

        Lobby lobby = lobbyRepository.findById(lobbyId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Lobby not found."));
        if (reservationRepository.hasActiveReservation(lobbyId, user.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.ALREADY_RESERVED, "User already reserved this lobby.");
        }
        if ("FULL".equals(lobby.status())) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.LOBBY_FULL, "No seats are currently available.");
        }
        if (!"OPEN".equals(lobby.status())) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.LOBBY_NOT_JOINABLE, "Lobby is not joinable.");
        }
        if (!lobby.startsAt().isAfter(Instant.now(clock))) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.LOBBY_NOT_JOINABLE, "Lobby has already started.");
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
        if (!reservationRepository.createIfAbsent(reservation)) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.ALREADY_RESERVED, "User already reserved this lobby.");
        }
        if (!lobbyRepository.tryReserveSeat(lobbyId)) {
            Lobby currentLobby = lobbyRepository.findById(lobbyId).orElse(lobby);
            if ("FULL".equals(currentLobby.status()) || currentLobby.reservedSeatCount() >= currentLobby.maxPlayers()) {
                throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.LOBBY_FULL, "No seats are currently available.");
            }
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.LOBBY_NOT_JOINABLE, "Lobby is no longer joinable.");
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
        if ("CANCELLED".equals(reservation.status())) {
            return reservation;
        }
        if (!isActive(reservation)) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Reservation cannot be cancelled.");
        }
        Lobby lobby = lobbyRepository.findById(reservation.lobbyId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Lobby not found."));
        Instant now = Instant.now(clock);
        if (!now.isBefore(lobby.cancellationDeadlineAt())) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                ApiErrorCode.CANCELLATION_WINDOW_CLOSED,
                "The cancellation window for this lobby has closed."
            );
        }
        boolean cancelled = reservationRepository.cancelActive(
            reservationId,
            user.userId(),
            now,
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

    private void requireReservationEligibility(AuthenticatedUser user) {
        requirePlayer(user);
        UserAccount account = authRepository.findUserById(user.userId())
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHENTICATED, "User account not found."));
        if (!account.roles().contains(UserRole.PLAYER)) {
            throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "Player role is required.");
        }
        if (account.status() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.ACCOUNT_RESTRICTED, "Account cannot create reservations.");
        }
        if (!account.isPhoneVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "Phone verification is required before reserving.");
        }
    }

    private boolean isActive(Reservation reservation) {
        return "RESERVED".equals(reservation.status()) || "CONFIRMED".equals(reservation.status());
    }
}
