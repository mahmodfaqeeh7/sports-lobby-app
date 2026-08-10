package com.sportslobby.reservations.api;

import com.sportslobby.reservations.application.ReservationService;
import com.sportslobby.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReservationController {
    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping("/api/v1/lobbies/{lobbyId}/reservations")
    public ReservationResponse join(@PathVariable UUID lobbyId, @AuthenticationPrincipal AuthenticatedUser user) {
        return ReservationResponse.from(reservationService.join(lobbyId, user));
    }

    @DeleteMapping("/api/v1/reservations/{reservationId}")
    public ReservationResponse cancel(
        @PathVariable UUID reservationId,
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody(required = false) CancelReservationRequest request
    ) {
        return ReservationResponse.from(reservationService.cancel(
            reservationId,
            user,
            request == null ? null : request.reasonCode()
        ));
    }

    @GetMapping("/api/v1/me/reservations")
    public List<ReservationResponse> mine(@AuthenticationPrincipal AuthenticatedUser user) {
        return reservationService.myReservations(user).stream().map(ReservationResponse::from).toList();
    }
}
