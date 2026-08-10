package com.sportslobby.courts.domain;

import java.util.List;
import java.util.UUID;

public record Court(
    UUID id,
    UUID venueId,
    String name,
    String description,
    String status,
    Integer defaultMinPlayers,
    Integer defaultMaxPlayers,
    List<UUID> sportIds
) {
}
