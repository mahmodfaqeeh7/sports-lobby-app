package com.sportslobby.files.application;

import java.net.URI;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Component
@ConditionalOnProperty(prefix = "app.files", name = "provider", havingValue = "s3")
public class S3ObjectStorageService implements ObjectStorageService {
    private final FileStorageProperties fileProperties;
    private final Clock clock;
    private final S3Client client;
    private final S3Presigner presigner;

    public S3ObjectStorageService(
        FileStorageProperties fileProperties,
        S3StorageProperties s3Properties,
        Clock clock
    ) {
        this.fileProperties = fileProperties;
        this.clock = clock;
        DefaultCredentialsProvider credentials = DefaultCredentialsProvider.create();
        Region region = Region.of(s3Properties.region());
        S3Configuration configuration = S3Configuration.builder()
            .pathStyleAccessEnabled(s3Properties.pathStyleAccess())
            .build();
        S3ClientBuilder clientBuilder = S3Client.builder()
            .region(region)
            .credentialsProvider(credentials)
            .serviceConfiguration(configuration)
            .httpClientBuilder(UrlConnectionHttpClient.builder());
        S3Presigner.Builder presignerBuilder = S3Presigner.builder()
            .region(region)
            .credentialsProvider(credentials)
            .serviceConfiguration(configuration);
        if (s3Properties.endpoint() != null && !s3Properties.endpoint().isBlank()) {
            URI endpoint = URI.create(s3Properties.endpoint().trim());
            clientBuilder.endpointOverride(endpoint);
            presignerBuilder.endpointOverride(endpoint);
        }
        this.client = clientBuilder.build();
        this.presigner = presignerBuilder.build();
    }

    @Override
    public SignedUpload createSignedUpload(
        UUID fileId,
        String bucketName,
        String objectKey,
        String contentType,
        long sizeBytes
    ) {
        PutObjectRequest objectRequest = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .contentType(contentType)
            .contentLength(sizeBytes)
            .build();
        PresignedPutObjectRequest signed = presigner.presignPutObject(
            PutObjectPresignRequest.builder()
                .signatureDuration(fileProperties.signedUploadTtl())
                .putObjectRequest(objectRequest)
                .build()
        );
        return new SignedUpload(
            signed.url().toExternalForm(),
            "PUT",
            Map.of("Content-Type", contentType),
            Instant.now(clock).plus(fileProperties.signedUploadTtl())
        );
    }

    @Override
    public SignedDownload createSignedDownload(
        String bucketName,
        String objectKey,
        String contentType,
        String fileName
    ) {
        GetObjectRequest objectRequest = GetObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .responseContentType(contentType)
            .responseContentDisposition("inline; filename=\"" + safeFileName(fileName) + "\"")
            .build();
        PresignedGetObjectRequest signed = presigner.presignGetObject(
            GetObjectPresignRequest.builder()
                .signatureDuration(fileProperties.signedDownloadTtl())
                .getObjectRequest(objectRequest)
                .build()
        );
        return new SignedDownload(
            signed.url().toExternalForm(),
            Instant.now(clock).plus(fileProperties.signedDownloadTtl())
        );
    }

    @Override
    public boolean uploadExists(String bucketName, String objectKey, String contentType, long sizeBytes) {
        try {
            HeadObjectResponse response = client.headObject(
                HeadObjectRequest.builder().bucket(bucketName).key(objectKey).build()
            );
            return response.contentLength() == sizeBytes
                && response.contentType() != null
                && response.contentType().equalsIgnoreCase(contentType);
        } catch (S3Exception exception) {
            if (exception.statusCode() == 404) {
                return false;
            }
            throw exception;
        }
    }

    private String safeFileName(String fileName) {
        return fileName.replaceAll("[\\r\\n\\\"]", "_");
    }
}
