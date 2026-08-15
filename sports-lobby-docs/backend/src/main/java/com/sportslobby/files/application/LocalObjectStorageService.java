package com.sportslobby.files.application;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.server.ResponseStatusException;

@Component
@ConditionalOnProperty(prefix = "app.files", name = "provider", havingValue = "local", matchIfMissing = true)
public class LocalObjectStorageService implements ObjectStorageService {
    private final FileStorageProperties properties;
    private final Clock clock;
    private final Path storageRoot;
    private final Map<String, PendingUpload> pendingUploads = new ConcurrentHashMap<>();
    private final Map<String, PendingDownload> pendingDownloads = new ConcurrentHashMap<>();

    public LocalObjectStorageService(FileStorageProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
        this.storageRoot = Path.of(properties.localStoragePath()).toAbsolutePath().normalize();
    }

    @Override
    public SignedUpload createSignedUpload(
        UUID fileId,
        String bucketName,
        String objectKey,
        String contentType,
        long sizeBytes
    ) {
        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now(clock).plus(properties.signedUploadTtl());
        pendingUploads.put(
            token,
            new PendingUpload(fileId, objectPath(bucketName, objectKey), contentType, sizeBytes, expiresAt)
        );
        return new SignedUpload(
            baseUrl() + "/api/v1/files/local/uploads/" + token,
            "PUT",
            Map.of("Content-Type", contentType),
            expiresAt
        );
    }

    @Override
    public SignedDownload createSignedDownload(
        String bucketName,
        String objectKey,
        String contentType,
        String fileName
    ) {
        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now(clock).plus(properties.signedDownloadTtl());
        pendingDownloads.put(
            token,
            new PendingDownload(objectPath(bucketName, objectKey), contentType, fileName, expiresAt)
        );
        return new SignedDownload(
            baseUrl() + "/api/v1/files/local/downloads/" + token,
            expiresAt
        );
    }

    public UUID acceptUpload(String token, String contentType, byte[] content) {
        PendingUpload pending = pendingUploads.get(token);
        if (pending == null || pending.expiresAt().isBefore(Instant.now(clock))) {
            pendingUploads.remove(token);
            throw new ResponseStatusException(HttpStatus.GONE, "The signed upload URL has expired.");
        }
        String mediaType = contentType.split(";", 2)[0].trim();
        if (!pending.contentType().equalsIgnoreCase(mediaType)) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "The upload content type does not match.");
        }
        if (content.length != pending.sizeBytes()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The upload size does not match.");
        }
        if (content.length > properties.maxVendorVerificationDocumentBytes()) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "The upload exceeds the 5 MB limit.");
        }

        try {
            Files.createDirectories(pending.path().getParent());
            Files.write(pending.path(), content);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "The upload could not be stored.", exception);
        }
        return pending.fileId();
    }

    public DownloadedObject readDownload(String token) {
        PendingDownload pending = pendingDownloads.get(token);
        if (pending == null || pending.expiresAt().isBefore(Instant.now(clock))) {
            pendingDownloads.remove(token);
            throw new ResponseStatusException(HttpStatus.GONE, "The signed download URL has expired.");
        }
        try {
            return new DownloadedObject(
                Files.readAllBytes(pending.path()),
                pending.contentType(),
                pending.fileName()
            );
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "The requested document was not found.", exception);
        }
    }

    @Override
    public boolean uploadExists(String bucketName, String objectKey, String contentType, long sizeBytes) {
        try {
            Path path = objectPath(bucketName, objectKey);
            return Files.isRegularFile(path) && Files.size(path) == sizeBytes;
        } catch (IOException exception) {
            return false;
        }
    }

    private Path objectPath(String bucketName, String objectKey) {
        Path bucketRoot = storageRoot.resolve(bucketName).normalize();
        Path path = bucketRoot.resolve(objectKey).normalize();
        if (!path.startsWith(bucketRoot)) {
            throw new IllegalArgumentException("Object key resolves outside the storage bucket.");
        }
        return path;
    }

    private String baseUrl() {
        return properties.localBaseUrl().replaceAll("/+$", "");
    }

    private record PendingUpload(
        UUID fileId,
        Path path,
        String contentType,
        long sizeBytes,
        Instant expiresAt
    ) {
    }

    private record PendingDownload(Path path, String contentType, String fileName, Instant expiresAt) {
    }

    public record DownloadedObject(byte[] content, String contentType, String fileName) {
    }
}
