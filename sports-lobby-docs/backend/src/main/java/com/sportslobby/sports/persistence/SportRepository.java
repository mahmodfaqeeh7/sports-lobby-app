package com.sportslobby.sports.persistence;

import com.sportslobby.sports.domain.Sport;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SportRepository {
    List<Sport> findActive();

    Optional<Sport> findActiveById(UUID id);
}
