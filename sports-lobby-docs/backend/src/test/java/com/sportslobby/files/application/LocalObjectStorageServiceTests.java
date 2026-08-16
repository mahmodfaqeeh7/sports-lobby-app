package com.sportslobby.files.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class LocalObjectStorageServiceTests {
    private static final Instant NOW = Instant.parse("2026-08-14T12:00:00Z");

    @TempDir
    Path storageRoot;

    @Test
    void signedUploadStoresExactBytesAndCanBeRetriedUntilExpiry() throws Exception {
        LocalObjectStorageService service = service(5 * 1024 * 1024);
        UUID fileId = UUID.randomUUID();
        byte[] content = "%PDF-1.4 test".getBytes();
        String objectKey = "vendor-verification/vendor/license.pdf";

        SignedUpload signed = service.createSignedUpload(
            fileId,
            "private-bucket",
            objectKey,
            "application/pdf",
            content.length
        );

        assertThat(signed.method()).isEqualTo("PUT");
        assertThat(signed.headers()).containsEntry("Content-Type", "application/pdf");
        assertThat(service.acceptUpload(token(signed.uploadUrl()), "application/pdf", content)).isEqualTo(fileId);
        assertThat(Files.readAllBytes(storageRoot.resolve("private-bucket").resolve(objectKey))).isEqualTo(content);

        assertThat(service.acceptUpload(token(signed.uploadUrl()), "application/pdf", content)).isEqualTo(fileId);
    }

    @Test
    void uploadRejectsMismatchedTypeSizeAndConfiguredLimit() {
        byte[] content = new byte[] {1, 2, 3};
        LocalObjectStorageService service = service(2);
        SignedUpload signed = service.createSignedUpload(
            UUID.randomUUID(),
            "private-bucket",
            "license.pdf",
            "application/pdf",
            content.length
        );

        assertThatThrownBy(() -> service.acceptUpload(token(signed.uploadUrl()), "image/png", content))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(error -> assertThat(((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE));
        assertThatThrownBy(() -> service.acceptUpload(token(signed.uploadUrl()), "application/pdf", new byte[] {1}))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(error -> assertThat(((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST));
        assertThatThrownBy(() -> service.acceptUpload(token(signed.uploadUrl()), "application/pdf", content))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(error -> assertThat(((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE));
    }

    private LocalObjectStorageService service(long maximumBytes) {
        FileStorageProperties properties = new FileStorageProperties(
            "local",
            "private-bucket",
            "vendor-verification",
            "court-images",
            Duration.ofMinutes(10),
            Duration.ofMinutes(5),
            maximumBytes,
            maximumBytes,
            "http://localhost:8080/",
            storageRoot.toString()
        );
        return new LocalObjectStorageService(properties, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private String token(String url) {
        String path = URI.create(url).getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }
}
