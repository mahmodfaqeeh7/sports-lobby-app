package com.sportslobby.vendors.api;

import com.sportslobby.files.application.SignedDownload;
import java.time.Instant;

public record SignedDownloadResponse(String downloadUrl, Instant expiresAt) {
    public static SignedDownloadResponse from(SignedDownload download) {
        return new SignedDownloadResponse(download.downloadUrl(), download.expiresAt());
    }
}
