package com.sportslobby.lobbies.domain;

import java.util.UUID;

public record LobbyDiscoveryItem(
    Lobby lobby,
    String venueName,
    String venueCity,
    String venueArea,
    String venueAddress,
    String courtName,
    UUID courtImageFileId,
    String sportCode,
    String sportName
) {
}
