package com.sportslobby.courts.api;

import com.sportslobby.courts.domain.Court;
import java.util.List;
import java.util.UUID;

public record CourtResponse(
    UUID id,
    UUID venueId,
    String name,
    String description,
    String status,
    Integer defaultMinPlayers,
    Integer defaultMaxPlayers,
    List<UUID> sportIds
) {
    public static CourtResponse from(Court court) {
        return new CourtResponse(
            court.id(),
            court.venueId(),
            court.name(),
            court.description(),
            court.status(),
            court.defaultMinPlayers(),
            court.defaultMaxPlayers(),
            court.sportIds()
        );
    }
}
