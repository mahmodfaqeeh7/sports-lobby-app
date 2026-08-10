package com.sportslobby.files.application;

import java.time.Instant;

public record SignedDownload(String downloadUrl, Instant expiresAt) {
}
