package com.sportslobby.reservations.api;

import jakarta.validation.constraints.Size;

public record CancelReservationRequest(@Size(max = 80) String reasonCode) {
}
