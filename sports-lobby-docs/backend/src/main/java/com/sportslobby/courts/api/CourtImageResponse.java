package com.sportslobby.courts.api;

import com.sportslobby.files.domain.FileRecord;
import java.util.UUID;

public record CourtImageResponse(UUID fileId, String uploadStatus) {
    public static CourtImageResponse from(FileRecord file) {
        return new CourtImageResponse(file.id(), file.uploadStatus().name());
    }
}
