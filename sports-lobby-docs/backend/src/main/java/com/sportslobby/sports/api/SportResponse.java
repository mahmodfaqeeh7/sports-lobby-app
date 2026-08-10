package com.sportslobby.sports.api;

import com.sportslobby.sports.domain.Sport;
import java.util.UUID;

public record SportResponse(UUID id, String code, String name) {
    public static SportResponse from(Sport sport) {
        return new SportResponse(sport.id(), sport.code(), sport.name());
    }
}
