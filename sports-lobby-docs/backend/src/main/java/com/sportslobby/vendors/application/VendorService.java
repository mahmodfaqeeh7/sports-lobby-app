package com.sportslobby.vendors.application;

import com.sportslobby.auth.api.UserResponse;
import com.sportslobby.auth.application.AuthService;
import com.sportslobby.auth.domain.AuthTokens;
import com.sportslobby.auth.domain.UserAccount;
import com.sportslobby.auth.domain.UserRole;
import com.sportslobby.auth.persistence.AuthRepository;
import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiException;
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
import com.sportslobby.vendors.api.DocumentUploadResponse;
import com.sportslobby.vendors.api.VendorSignupRequest;
import com.sportslobby.vendors.domain.SubmissionStatus;
import com.sportslobby.vendors.domain.VerificationStatus;
import com.sportslobby.vendors.domain.Vendor;
import com.sportslobby.vendors.domain.VendorMemberRole;
import com.sportslobby.vendors.domain.VendorMemberStatus;
import com.sportslobby.vendors.domain.VendorVerificationSubmission;
import com.sportslobby.vendors.persistence.VendorRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VendorService {
    private static final List<String> ALLOWED_VERIFICATION_CONTENT_TYPES = List.of(
        "application/pdf",
        "image/jpeg",
        "image/png"
    );

    private final VendorRepository vendorRepository;
    private final FileRepository fileRepository;
    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final ObjectStorageService objectStorageService;
    private final FileStorageProperties fileStorageProperties;
    private final Clock clock;

    public VendorService(
        VendorRepository vendorRepository,
        FileRepository fileRepository,
        AuthRepository authRepository,
        PasswordEncoder passwordEncoder,
        AuthService authService,
        ObjectStorageService objectStorageService,
        FileStorageProperties fileStorageProperties,
        Clock clock
    ) {
        this.vendorRepository = vendorRepository;
        this.fileRepository = fileRepository;
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.objectStorageService = objectStorageService;
        this.fileStorageProperties = fileStorageProperties;
        this.clock = clock;
    }

    @Transactional
    public VendorSignupResult signup(VendorSignupRequest request) {
        String email = normalizeEmail(request.email());
        String phoneE164 = normalizePhone(request.phoneE164());
        if (authRepository.emailExists(email)) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Email is already registered.");
        }
        if (authRepository.phoneExists(phoneE164)) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Phone number is already registered.");
        }

        Instant now = Instant.now(clock);
        UUID ownerUserId = UUID.randomUUID();
        authRepository.createUser(
            ownerUserId,
            normalizeName(request.firstName()),
            normalizeName(request.lastName()),
            email,
            phoneE164,
            passwordEncoder.encode(request.password())
        );
        authRepository.addRole(ownerUserId, UserRole.VENDOR);

        Vendor vendor = new Vendor(
            UUID.randomUUID(),
            ownerUserId,
            normalizeRequired(request.businessName()),
            normalizePhone(request.contactPhone()),
            normalizeEmail(request.contactEmail()),
            request.countryCode().trim().toUpperCase(Locale.ROOT),
            normalizeRequired(request.city()),
            normalizeOptional(request.area()),
            normalizeRequired(request.addressLine()),
            request.latitude(),
            request.longitude(),
            normalizeOptional(request.supportedSports()),
            request.venueCountEstimate(),
            normalizeOptional(request.openingHours()),
            VerificationStatus.PENDING,
            null,
            null,
            now,
            now
        );
        vendorRepository.createVendor(vendor);
        vendorRepository.createMember(vendor.id(), ownerUserId, VendorMemberRole.OWNER, VendorMemberStatus.ACTIVE, now);

        VendorVerificationSubmission submission = createInitialSubmission(vendor, now);
        vendorRepository.createSubmission(submission);
        List<DocumentUploadResponse> documentUploads = request.verificationDocuments().stream()
            .map(document -> createVerificationDocumentUpload(ownerUserId, vendor.id(), submission.id(), document, now))
            .toList();
        authService.requestPhoneVerification(phoneE164, ownerUserId);

        UserAccount user = authRepository.findUserById(ownerUserId).orElseThrow();
        AuthTokens tokens = authService.issueTokensFor(user, request.deviceLabel());
        return new VendorSignupResult(user, tokens, vendor, submission, documentUploads);
    }

    @Transactional(readOnly = true)
    public Vendor getMyVendor(AuthenticatedUser user) {
        requireRole(user, UserRole.VENDOR);
        return vendorRepository.findByOwnerUserId(user.userId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Vendor not found."));
    }

    @Transactional(readOnly = true)
    public List<Vendor> findPendingVendors(AuthenticatedUser adminUser) {
        requireRole(adminUser, UserRole.ADMIN);
        return vendorRepository.findPendingVendors();
    }

    @Transactional
    public Vendor approveVendor(UUID vendorId, AuthenticatedUser adminUser, String reason) {
        requireRole(adminUser, UserRole.ADMIN);
        Instant now = Instant.now(clock);
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Vendor not found."));
        VendorVerificationSubmission submission = requirePendingSubmission(vendor.id());

        vendorRepository.reviewSubmission(submission.id(), SubmissionStatus.APPROVED.name(), adminUser.userId(), normalizeOptional(reason), now);
        vendorRepository.updateVendorVerificationStatus(vendor.id(), VerificationStatus.APPROVED, now, null, now);
        vendorRepository.createAuditEvent(
            UUID.randomUUID(),
            adminUser.userId(),
            "VENDOR_APPROVED",
            "VENDOR",
            vendor.id(),
            normalizeOptional(reason),
            now
        );
        return vendorRepository.findById(vendor.id()).orElseThrow();
    }

    @Transactional
    public Vendor rejectVendor(UUID vendorId, AuthenticatedUser adminUser, String reason) {
        requireRole(adminUser, UserRole.ADMIN);
        String normalizedReason = normalizeOptional(reason);
        if (normalizedReason == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Rejection reason is required.");
        }

        Instant now = Instant.now(clock);
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Vendor not found."));
        VendorVerificationSubmission submission = requirePendingSubmission(vendor.id());

        vendorRepository.reviewSubmission(submission.id(), SubmissionStatus.REJECTED.name(), adminUser.userId(), normalizedReason, now);
        vendorRepository.updateVendorVerificationStatus(vendor.id(), VerificationStatus.REJECTED, null, null, now);
        vendorRepository.createAuditEvent(
            UUID.randomUUID(),
            adminUser.userId(),
            "VENDOR_REJECTED",
            "VENDOR",
            vendor.id(),
            normalizedReason,
            now
        );
        return vendorRepository.findById(vendor.id()).orElseThrow();
    }

    @Transactional(readOnly = true)
    public SignedDownload createVendorDocumentDownload(UUID fileId, AuthenticatedUser user) {
        requireRole(user, UserRole.VENDOR);
        Vendor vendor = getMyVendor(user);
        if (!vendorRepository.ownsDocument(vendor.id(), fileId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Document not found.");
        }
        FileRecord file = fileRepository.findById(fileId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Document not found."));
        return objectStorageService.createSignedDownload(file.bucketName(), file.objectKey());
    }

    @Transactional(readOnly = true)
    public SignedDownload createAdminDocumentDownload(UUID fileId, AuthenticatedUser adminUser) {
        requireRole(adminUser, UserRole.ADMIN);
        FileRecord file = fileRepository.findById(fileId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Document not found."));
        if (file.purpose() != FilePurpose.VENDOR_VERIFICATION_DOCUMENT) {
            throw new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Document not found.");
        }
        return objectStorageService.createSignedDownload(file.bucketName(), file.objectKey());
    }

    private VendorVerificationSubmission createInitialSubmission(Vendor vendor, Instant now) {
        return new VendorVerificationSubmission(
            UUID.randomUUID(),
            vendor.id(),
            SubmissionStatus.PENDING,
            now,
            null,
            null,
            null,
            1,
            vendor.businessName(),
            vendor.contactPhone(),
            vendor.contactEmail(),
            vendor.countryCode(),
            vendor.city(),
            vendor.area(),
            vendor.addressLine(),
            vendor.latitude(),
            vendor.longitude(),
            vendor.supportedSports(),
            vendor.venueCountEstimate(),
            vendor.openingHours(),
            now,
            now
        );
    }

    private DocumentUploadResponse createVerificationDocumentUpload(
        UUID ownerUserId,
        UUID vendorId,
        UUID submissionId,
        VendorSignupRequest.VerificationDocumentRequest document,
        Instant now
    ) {
        validateDocument(document);
        UUID fileId = UUID.randomUUID();
        String objectKey = fileStorageProperties.vendorVerificationPrefix()
            + "/"
            + vendorId
            + "/"
            + fileId
            + "-"
            + sanitizeFileName(document.fileName());
        FileRecord file = new FileRecord(
            fileId,
            ownerUserId,
            vendorId,
            FilePurpose.VENDOR_VERIFICATION_DOCUMENT,
            "S3",
            fileStorageProperties.bucket(),
            objectKey,
            document.fileName().trim(),
            normalizeContentType(document.contentType()),
            document.sizeBytes(),
            FileAccessLevel.PRIVATE,
            FileUploadStatus.PENDING_UPLOAD,
            now,
            now
        );
        fileRepository.create(file);
        vendorRepository.createSubmissionDocument(
            UUID.randomUUID(),
            submissionId,
            fileId,
            document.documentType(),
            now
        );
        SignedUpload signedUpload = objectStorageService.createSignedUpload(
            file.bucketName(),
            file.objectKey(),
            file.contentType(),
            file.sizeBytes()
        );
        return DocumentUploadResponse.from(file.id(), document.documentType().name(), file.objectKey(), signedUpload);
    }

    private void validateDocument(VendorSignupRequest.VerificationDocumentRequest document) {
        String contentType = normalizeContentType(document.contentType());
        if (!ALLOWED_VERIFICATION_CONTENT_TYPES.contains(contentType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Unsupported verification document type.");
        }
        if (document.sizeBytes() > fileStorageProperties.maxVendorVerificationDocumentBytes()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Verification document is too large.");
        }
    }

    private VendorVerificationSubmission requirePendingSubmission(UUID vendorId) {
        VendorVerificationSubmission submission = vendorRepository.findLatestSubmission(vendorId)
            .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Vendor has no verification submission."));
        if (submission.status() != SubmissionStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Vendor verification has already been reviewed.");
        }
        return submission;
    }

    private void requireRole(AuthenticatedUser user, UserRole role) {
        if (user == null || !user.roles().contains(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "Required role is missing.");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePhone(String phoneE164) {
        return phoneE164.trim();
    }

    private String normalizeName(String name) {
        return name.trim().replaceAll("\\s+", " ");
    }

    private String normalizeRequired(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeContentType(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String sanitizeFileName(String fileName) {
        return fileName.trim().replaceAll("[^A-Za-z0-9._-]", "_");
    }

    public record VendorSignupResult(
        UserAccount user,
        AuthTokens tokens,
        Vendor vendor,
        VendorVerificationSubmission submission,
        List<DocumentUploadResponse> documentUploads
    ) {
    }
}
