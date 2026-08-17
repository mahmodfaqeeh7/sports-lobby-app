package com.sportslobby.lobbies.domain;

import java.math.BigDecimal;
import java.util.UUID;

public record LobbyDiscoveryItem(
    Lobby lobby,
    String venueName,
    String venueCity,
    String venueArea,
    String venueAddress,
    String venueCountryCode,
    BigDecimal venueLatitude,
    BigDecimal venueLongitude,
    String venueContactPhone,
    String courtName,
    UUID courtImageFileId,
    String sportCode,
    String sportName
) {
}
