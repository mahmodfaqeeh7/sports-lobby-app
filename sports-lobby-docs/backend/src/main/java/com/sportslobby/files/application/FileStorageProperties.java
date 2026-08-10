package com.sportslobby.files.application;

import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.files")
public record FileStorageProperties(
    @NotBlank String bucket,
    String vendorVerificationPrefix,
    Duration signedUploadTtl,
    Duration signedDownloadTtl,
    long maxVendorVerificationDocumentBytes
) {
    public FileStorageProperties {
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
            maxVendorVerificationDocumentBytes = 10 * 1024 * 1024;
        }
    }
}
