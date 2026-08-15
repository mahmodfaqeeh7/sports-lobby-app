package com.sportslobby.files.application;

import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.files")
public record FileStorageProperties(
    @NotBlank String provider,
    @NotBlank String bucket,
    String vendorVerificationPrefix,
    Duration signedUploadTtl,
    Duration signedDownloadTtl,
    long maxVendorVerificationDocumentBytes,
    String localBaseUrl,
    String localStoragePath
) {
    public FileStorageProperties {
        if (provider == null || provider.isBlank()) {
            provider = "local";
        }
        provider = provider.trim().toLowerCase();
        if (!provider.equals("local") && !provider.equals("s3")) {
            throw new IllegalArgumentException("app.files.provider must be 'local' or 's3'.");
        }
        if (vendorVerificationPrefix == null || vendorVerificationPrefix.isBlank()) {
            vendorVerificationPrefix = "vendor-verification";
        }
        if (signedUploadTtl == null) {
            signedUploadTtl = Duration.ofMinutes(10);
        }
        if (signedDownloadTtl == null) {
            signedDownloadTtl = Duration.ofMinutes(5);
        }
        if (maxVendorVerificationDocumentBytes <= 0) {
            maxVendorVerificationDocumentBytes = 5 * 1024 * 1024;
        }
        if (localBaseUrl == null || localBaseUrl.isBlank()) {
            localBaseUrl = "http://localhost:8080";
        }
        if (localStoragePath == null || localStoragePath.isBlank()) {
            localStoragePath = ".local-object-storage";
        }
    }
}
