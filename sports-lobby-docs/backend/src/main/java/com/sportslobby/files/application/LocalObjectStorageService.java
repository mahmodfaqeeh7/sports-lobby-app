package com.sportslobby.files.application;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class LocalObjectStorageService implements ObjectStorageService {
    private final FileStorageProperties properties;
    private final Clock clock;

    public LocalObjectStorageService(FileStorageProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    @Override
    public SignedUpload createSignedUpload(String bucketName, String objectKey, String contentType, long sizeBytes) {
        return new SignedUpload(
            "http://localhost:4566/" + encode(bucketName) + "/" + encode(objectKey) + "?signed=upload",
            "PUT",
            Map.of("Content-Type", contentType),
            Instant.now(clock).plus(properties.signedUploadTtl())
        );
    }

    @Override
    public SignedDownload createSignedDownload(String bucketName, String objectKey) {
        return new SignedDownload(
            "http://localhost:4566/" + encode(bucketName) + "/" + encode(objectKey) + "?signed=download",
            Instant.now(clock).plus(properties.signedDownloadTtl())
        );
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
