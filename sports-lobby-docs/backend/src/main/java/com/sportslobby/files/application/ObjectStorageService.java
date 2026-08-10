package com.sportslobby.files.application;

public interface ObjectStorageService {
    SignedUpload createSignedUpload(String bucketName, String objectKey, String contentType, long sizeBytes);

    SignedDownload createSignedDownload(String bucketName, String objectKey);
}
