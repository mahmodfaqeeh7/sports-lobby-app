package com.sportslobby.files.persistence;

import com.sportslobby.files.domain.FileRecord;
import java.util.Optional;
import java.util.UUID;
import java.time.Instant;

public interface FileRepository {
    void create(FileRecord file);

    Optional<FileRecord> findById(UUID fileId);

    void markUploaded(UUID fileId, Instant uploadedAt);

    void markAbandoned(UUID fileId, Instant abandonedAt);
}
