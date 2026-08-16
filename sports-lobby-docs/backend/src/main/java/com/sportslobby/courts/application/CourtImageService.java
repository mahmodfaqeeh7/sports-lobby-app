package com.sportslobby.courts.application;

import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiException;
import com.sportslobby.courts.api.CourtImageUploadRequest;
import com.sportslobby.courts.api.CourtImageUploadResponse;
import com.sportslobby.courts.persistence.CourtRepository;
import com.sportslobby.files.application.FileStorageProperties;
import com.sportslobby.files.application.ObjectStorageService;
import com.sportslobby.files.application.SignedDownload;
import com.sportslobby.files.application.SignedUpload;
import com.sportslobby.files.domain.FileAccessLevel;
import com.sportslobby.files.domain.FilePurpose;
import com.sportslobby.files.domain.FileRecord;
import com.sportslobby.files.domain.FileUploadStatus;
import com.sportslobby.files.persistence.FileRepository;
import com.sportslobby.security.AuthenticatedUser;
import com.sportslobby.vendors.application.VendorService;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CourtImageService {
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "image/jpeg",
        "image/png",
        "image/webp"
    );

    private final VendorService vendorService;
    private final FileRepository fileRepository;
    private final CourtRepository courtRepository;
    private final ObjectStorageService objectStorageService;
    private final FileStorageProperties properties;
    private final Clock clock;

    public CourtImageService(
        VendorService vendorService,
        FileRepository fileRepository,
        CourtRepository courtRepository,
        ObjectStorageService objectStorageService,
        FileStorageProperties properties,
        Clock clock
    ) {
        this.vendorService = vendorService;
        this.fileRepository = fileRepository;
        this.courtRepository = courtRepository;
        this.objectStorageService = objectStorageService;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional
    public CourtImageUploadResponse createUpload(CourtImageUploadRequest request, AuthenticatedUser user) {
        var vendor = vendorService.getMyVendor(user);
        String contentType = normalizeContentType(request.contentType());
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw validation("Court image must be a JPEG, PNG, or WebP file.");
        }
        if (request.sizeBytes() > properties.maxCourtImageBytes()) {
            throw validation("Court image is too large.");
        }

        Instant now = Instant.now(clock);
        UUID fileId = UUID.randomUUID();
        String objectKey = properties.courtImagesPrefix()
            + "/" + vendor.id() + "/" + fileId + "-" + sanitizeFileName(request.fileName());
        FileRecord file = new FileRecord(
            fileId,
            user.userId(),
            vendor.id(),
            FilePurpose.COURT_IMAGE,
            properties.provider().toUpperCase(Locale.ROOT),
            properties.bucket(),
            objectKey,
            request.fileName().trim(),
            contentType,
            request.sizeBytes(),
            FileAccessLevel.PUBLIC,
            FileUploadStatus.PENDING_UPLOAD,
            now,
            now
        );
        fileRepository.create(file);
        SignedUpload upload = objectStorageService.createSignedUpload(
            file.id(), file.bucketName(), file.objectKey(), file.contentType(), file.sizeBytes()
        );
        return CourtImageUploadResponse.from(file.id(), upload);
    }

    @Transactional
    public FileRecord completeUpload(UUID fileId, AuthenticatedUser user) {
        var vendor = vendorService.getMyVendor(user);
        FileRecord file = requireOwnedCourtImage(fileId, vendor.id());
        if (file.uploadStatus() == FileUploadStatus.UPLOADED) {
            return file;
        }
        if (!objectStorageService.uploadExists(
            file.bucketName(), file.objectKey(), file.contentType(), file.sizeBytes()
        )) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                ApiErrorCode.CONFLICT,
                "Court image upload has not reached storage yet."
            );
        }
        fileRepository.markUploaded(file.id(), Instant.now(clock));
        return fileRepository.findById(file.id()).orElseThrow();
    }

    @Transactional(readOnly = true)
    public FileRecord requireUsableImage(UUID fileId, UUID vendorId) {
        FileRecord file = requireOwnedCourtImage(fileId, vendorId);
        if (file.uploadStatus() != FileUploadStatus.UPLOADED) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Court image upload is not complete.");
        }
        if (courtRepository.isImageInUse(fileId)) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Court image is already assigned to a court.");
        }
        return file;
    }

    @Transactional(readOnly = true)
    public Optional<SignedDownload> createDisplayUrl(UUID fileId) {
        if (fileId == null) {
            return Optional.empty();
        }
        return fileRepository.findById(fileId)
            .filter(candidate -> candidate.purpose() == FilePurpose.COURT_IMAGE)
            .filter(candidate -> candidate.uploadStatus() == FileUploadStatus.UPLOADED)
            .map(file -> objectStorageService.createSignedDownload(
                file.bucketName(), file.objectKey(), file.contentType(), file.originalFileName()
            ));
    }

    private FileRecord requireOwnedCourtImage(UUID fileId, UUID vendorId) {
        return fileRepository.findById(fileId)
            .filter(file -> file.purpose() == FilePurpose.COURT_IMAGE)
            .filter(file -> vendorId.equals(file.ownerVendorId()))
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Court image not found."));
    }

    private String normalizeContentType(String contentType) {
        String normalized = contentType.trim().toLowerCase(Locale.ROOT);
        return "image/jpg".equals(normalized) ? "image/jpeg" : normalized;
    }

    private String sanitizeFileName(String fileName) {
        String sanitized = fileName.trim().replaceAll("[^A-Za-z0-9._-]", "_");
        return sanitized.isBlank() ? "court-image" : sanitized;
    }

    private ApiException validation(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, message);
    }
}
