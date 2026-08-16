package com.sportslobby.courts.persistence;

import com.sportslobby.courts.domain.Court;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourtRepository {
    void create(Court court);

    List<Court> findByVenueId(UUID venueId);

    Optional<Court> findById(UUID courtId);

    boolean supportsSport(UUID courtId, UUID sportId);

    boolean isImageInUse(UUID imageFileId);
}
