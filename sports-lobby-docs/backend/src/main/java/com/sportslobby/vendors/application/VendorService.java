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
import com.sportslobby.vendors.api.ReplaceDocumentUploadRequest;
import com.sportslobby.vendors.api.VendorResubmissionRequest;
import com.sportslobby.vendors.api.VendorSignupRequest;
import com.sportslobby.vendors.domain.SubmissionStatus;
import com.sportslobby.vendors.domain.VerificationDocumentFile;
import com.sportslobby.vendors.domain.VerificationDocumentType;
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
        authService.recordLegalConsents(ownerUserId, now);

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
            null,
            null,
            normalizeOptional(request.supportedSports()),
            request.venueCountEstimate(),
            normalizeOptional(request.openingHours()),
            VerificationStatus.PENDING,
            null,
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
    public VendorKycResult getMyKyc(AuthenticatedUser user) {
        Vendor vendor = getMyVendor(user);
        VendorVerificationSubmission latestSubmission = vendorRepository.findLatestSubmission(vendor.id())
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                ApiErrorCode.RESOURCE_NOT_FOUND,
                "Vendor verification submission not found."
            ));
        return new VendorKycResult(
            vendor,
            latestSubmission,
            vendorRepository.findSubmissionDocuments(latestSubmission.id())
        );
    }

    @Transactional
    public DocumentUploadResponse continueDocumentUpload(
        UUID fileId,
        ReplaceDocumentUploadRequest request,
        AuthenticatedUser user
    ) {
        Vendor vendor = getMyVendor(user);
        VendorVerificationSubmission submission = requirePendingSubmission(vendor.id());
        VerificationDocumentFile document = vendorRepository.findSubmissionDocuments(submission.id()).stream()
            .filter(candidate -> candidate.file().id().equals(fileId))
            .findFirst()
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                ApiErrorCode.RESOURCE_NOT_FOUND,
                "Pending verification document not found."
            ));
        if (document.file().uploadStatus() == FileUploadStatus.UPLOADED) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "The document is already uploaded.");
        }
        if (document.file().uploadStatus() != FileUploadStatus.PENDING_UPLOAD) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "The document can no longer be uploaded.");
        }

        VendorSignupRequest.VerificationDocumentRequest replacement =
            new VendorSignupRequest.VerificationDocumentRequest(
                document.documentType(),
                request.fileName(),
                request.contentType(),
                request.sizeBytes()
            );
        validateDocument(replacement);
        Instant now = Instant.now(clock);
        FileRecord uploadFile = document.file();
        boolean sameFileMetadata = uploadFile.originalFileName().equals(request.fileName().trim())
            && uploadFile.contentType().equals(normalizeContentType(request.contentType()))
            && uploadFile.sizeBytes() == request.sizeBytes();
        if (!sameFileMetadata) {
            uploadFile = createPendingVerificationFile(vendor.ownerUserId(), vendor.id(), replacement, now);
            vendorRepository.replaceSubmissionDocumentFile(document.id(), document.file().id(), uploadFile.id());
            fileRepository.markAbandoned(document.file().id(), now);
        }
        return signedUploadResponse(uploadFile, document.documentType());
    }

    @Transactional
    public VerificationDocumentFile completeDocumentUpload(UUID fileId, AuthenticatedUser user) {
        Vendor vendor = getMyVendor(user);
        VendorVerificationSubmission submission = requirePendingSubmission(vendor.id());
        VerificationDocumentFile document = vendorRepository.findSubmissionDocuments(submission.id()).stream()
            .filter(candidate -> candidate.file().id().equals(fileId))
            .findFirst()
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                ApiErrorCode.RESOURCE_NOT_FOUND,
                "Pending verification document not found."
            ));
        if (document.file().uploadStatus() == FileUploadStatus.UPLOADED) {
            return document;
        }
        FileRecord file = document.file();
        if (file.uploadStatus() != FileUploadStatus.PENDING_UPLOAD
            || !objectStorageService.uploadExists(
                file.bucketName(), file.objectKey(), file.contentType(), file.sizeBytes()
            )) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                ApiErrorCode.CONFLICT,
                "The uploaded object could not be verified. Upload the complete file and try again."
            );
        }
        fileRepository.markUploaded(file.id(), Instant.now(clock));
        return vendorRepository.findSubmissionDocuments(submission.id()).stream()
            .filter(candidate -> candidate.file().id().equals(fileId))
            .findFirst()
            .orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<Vendor> findPendingVendors(AuthenticatedUser adminUser) {
        requireRole(adminUser, UserRole.ADMIN);
        return vendorRepository.findPendingVendors();
    }

    @Transactional(readOnly = true)
    public AdminVendorReview getAdminReview(UUID vendorId, AuthenticatedUser adminUser) {
        requireRole(adminUser, UserRole.ADMIN);
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Vendor not found."));
        VendorVerificationSubmission submission = vendorRepository.findLatestSubmission(vendor.id())
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                ApiErrorCode.RESOURCE_NOT_FOUND,
                "Vendor verification submission not found."
            ));
        UserAccount owner = authRepository.findUserById(vendor.ownerUserId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Vendor owner not found."));
        List<VerificationDocumentFile> documents = vendorRepository.findSubmissionDocuments(submission.id());
        return new AdminVendorReview(vendor, owner, submission, documents, documentsReadyForDecision(documents));
    }

    @Transactional
    public Vendor approveVendor(UUID vendorId, AuthenticatedUser adminUser, String reason) {
        requireRole(adminUser, UserRole.ADMIN);
        Instant now = Instant.now(clock);
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Vendor not found."));
        VendorVerificationSubmission submission = requirePendingSubmission(vendor.id());

        List<VerificationDocumentFile> documents = vendorRepository.findSubmissionDocuments(submission.id());
        if (!documentsReadyForDecision(documents)) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                ApiErrorCode.CONFLICT,
                "Approval requires an uploaded business license and no unfinished document uploads."
            );
        }

        if (!vendorRepository.reviewSubmission(
            submission.id(), SubmissionStatus.APPROVED.name(), adminUser.userId(), normalizeOptional(reason), now
        )) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Vendor verification was already reviewed.");
        }
        vendorRepository.updateVendorVerificationStatus(vendor.id(), VerificationStatus.APPROVED, null, now, null, now);
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

        if (!vendorRepository.reviewSubmission(
            submission.id(), SubmissionStatus.REJECTED.name(), adminUser.userId(), normalizedReason, now
        )) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Vendor verification was already reviewed.");
        }
        vendorRepository.updateVendorVerificationStatus(
            vendor.id(),
            VerificationStatus.REJECTED,
            normalizedReason,
            null,
            null,
            now
        );
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

    @Transactional
    public Vendor suspendVendor(UUID vendorId, AuthenticatedUser adminUser, String reason) {
        requireRole(adminUser, UserRole.ADMIN);
        String normalizedReason = normalizeOptional(reason);
        if (normalizedReason == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Suspension reason is required.");
        }

        Instant now = Instant.now(clock);
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Vendor not found."));
        if (vendor.verificationStatus() != VerificationStatus.APPROVED) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Only an approved vendor can be suspended.");
        }

        vendorRepository.updateVendorVerificationStatus(
            vendor.id(),
            VerificationStatus.SUSPENDED,
            normalizedReason,
            vendor.approvedAt(),
            now,
            now
        );
        vendorRepository.createAuditEvent(
            UUID.randomUUID(), adminUser.userId(), "VENDOR_SUSPENDED", "VENDOR", vendor.id(), normalizedReason, now
        );
        return vendorRepository.findById(vendor.id()).orElseThrow();
    }

    @Transactional
    public Vendor reactivateVendor(UUID vendorId, AuthenticatedUser adminUser, String reason) {
        requireRole(adminUser, UserRole.ADMIN);
        Instant now = Instant.now(clock);
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Vendor not found."));
        if (vendor.verificationStatus() != VerificationStatus.SUSPENDED) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Only a suspended vendor can be reactivated.");
        }

        vendorRepository.updateVendorVerificationStatus(
            vendor.id(),
            VerificationStatus.APPROVED,
            null,
            vendor.approvedAt() == null ? now : vendor.approvedAt(),
            null,
            now
        );
        vendorRepository.createAuditEvent(
            UUID.randomUUID(),
            adminUser.userId(),
            "VENDOR_REACTIVATED",
            "VENDOR",
            vendor.id(),
            normalizeOptional(reason),
            now
        );
        return vendorRepository.findById(vendor.id()).orElseThrow();
    }

    @Transactional
    public VendorResubmissionResult resubmitVerification(
        VendorResubmissionRequest request,
        AuthenticatedUser user
    ) {
        Vendor vendor = getMyVendor(user);
        if (vendor.verificationStatus() != VerificationStatus.REJECTED) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                ApiErrorCode.CONFLICT,
                "Only a rejected application can be resubmitted."
            );
        }

        VendorVerificationSubmission previous = vendorRepository.findLatestSubmission(vendor.id())
            .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Vendor has no verification submission."));
        Instant now = Instant.now(clock);
        VendorVerificationSubmission submission = createSubmission(vendor, previous.submissionNumber() + 1, now);
        vendorRepository.createSubmission(submission);
        List<DocumentUploadResponse> uploads = request.verificationDocuments().stream()
            .map(document -> createVerificationDocumentUpload(
                vendor.ownerUserId(), vendor.id(), submission.id(), document, now
            ))
            .toList();
        vendorRepository.updateVendorVerificationStatus(
            vendor.id(), VerificationStatus.PENDING, null, null, null, now
        );
        return new VendorResubmissionResult(
            vendorRepository.findById(vendor.id()).orElseThrow(),
            submission,
            uploads
        );
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
        requireUploaded(file);
        return objectStorageService.createSignedDownload(
            file.bucketName(), file.objectKey(), file.contentType(), file.originalFileName()
        );
    }

    @Transactional(readOnly = true)
    public SignedDownload createAdminDocumentDownload(UUID fileId, AuthenticatedUser adminUser) {
        requireRole(adminUser, UserRole.ADMIN);
        FileRecord file = fileRepository.findById(fileId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Document not found."));
        if (file.purpose() != FilePurpose.VENDOR_VERIFICATION_DOCUMENT) {
            throw new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Document not found.");
        }
        requireUploaded(file);
        return objectStorageService.createSignedDownload(
            file.bucketName(), file.objectKey(), file.contentType(), file.originalFileName()
        );
    }

    private VendorVerificationSubmission createInitialSubmission(Vendor vendor, Instant now) {
        return createSubmission(vendor, 1, now);
    }

    private VendorVerificationSubmission createSubmission(Vendor vendor, int submissionNumber, Instant now) {
        return new VendorVerificationSubmission(
            UUID.randomUUID(),
            vendor.id(),
            SubmissionStatus.PENDING,
            now,
            null,
            null,
            null,
            submissionNumber,
            vendor.businessName(),
            vendor.contactPhone(),
            vendor.contactEmail(),
            vendor.countryCode(),
            vendor.city(),
            vendor.area(),
            vendor.addressLine(),
            null,
            null,
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
        FileRecord file = createPendingVerificationFile(ownerUserId, vendorId, document, now);
        vendorRepository.createSubmissionDocument(
            UUID.randomUUID(),
            submissionId,
            file.id(),
            document.documentType(),
            now
        );
        return signedUploadResponse(file, document.documentType());
    }

    private FileRecord createPendingVerificationFile(
        UUID ownerUserId,
        UUID vendorId,
        VendorSignupRequest.VerificationDocumentRequest document,
        Instant now
    ) {
        UUID fileId = UUID.randomUUID();
        String objectKey = fileStorageProperties.vendorVerificationPrefix()
            + "/" + vendorId + "/" + fileId + "-" + sanitizeFileName(document.fileName());
        FileRecord file = new FileRecord(
            fileId,
            ownerUserId,
            vendorId,
            FilePurpose.VENDOR_VERIFICATION_DOCUMENT,
            fileStorageProperties.provider().toUpperCase(Locale.ROOT),
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
        return file;
    }

    private DocumentUploadResponse signedUploadResponse(FileRecord file, VerificationDocumentType documentType) {
        SignedUpload signedUpload = objectStorageService.createSignedUpload(
            file.id(),
            file.bucketName(),
            file.objectKey(),
            file.contentType(),
            file.sizeBytes()
        );
        return DocumentUploadResponse.from(file.id(), documentType.name(), file.objectKey(), signedUpload);
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

    private boolean documentsReadyForDecision(List<VerificationDocumentFile> documents) {
        boolean uploadedBusinessLicense = documents.stream().anyMatch(document ->
            document.documentType() == VerificationDocumentType.BUSINESS_LICENSE
                && document.file().uploadStatus() == FileUploadStatus.UPLOADED
        );
        return uploadedBusinessLicense && documents.stream().allMatch(document ->
            document.file().uploadStatus() == FileUploadStatus.UPLOADED
        );
    }

    private void requireUploaded(FileRecord file) {
        if (file.uploadStatus() != FileUploadStatus.UPLOADED) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                ApiErrorCode.CONFLICT,
                "The document upload is not complete."
            );
        }
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

    public record VendorKycResult(
        Vendor vendor,
        VendorVerificationSubmission latestSubmission,
        List<VerificationDocumentFile> documents
    ) {
    }

    public record VendorResubmissionResult(
        Vendor vendor,
        VendorVerificationSubmission submission,
        List<DocumentUploadResponse> documentUploads
    ) {
    }

    public record AdminVendorReview(
        Vendor vendor,
        UserAccount owner,
        VendorVerificationSubmission submission,
        List<VerificationDocumentFile> documents,
        boolean readyForDecision
    ) {
    }
}
