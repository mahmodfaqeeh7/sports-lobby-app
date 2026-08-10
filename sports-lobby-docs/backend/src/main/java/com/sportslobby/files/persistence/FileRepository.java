package com.sportslobby.files.persistence;

import com.sportslobby.files.domain.FileRecord;
import java.util.Optional;
import java.util.UUID;

public interface FileRepository {
    void create(FileRecord file);

    Optional<FileRecord> findById(UUID fileId);
}
