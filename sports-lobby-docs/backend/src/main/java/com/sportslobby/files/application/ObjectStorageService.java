package com.sportslobby.files.application;

import java.util.UUID;

public interface ObjectStorageService {
    SignedUpload createSignedUpload(UUID fileId, String bucketName, String objectKey, String contentType, long sizeBytes);

    SignedDownload createSignedDownload(String bucketName, String objectKey, String contentType, String fileName);

    boolean uploadExists(String bucketName, String objectKey, String contentType, long sizeBytes);
}
