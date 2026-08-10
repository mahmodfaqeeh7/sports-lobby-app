package com.sportslobby.vendors.persistence;

import com.sportslobby.vendors.domain.VerificationDocumentType;
import com.sportslobby.vendors.domain.VerificationStatus;
import com.sportslobby.vendors.domain.Vendor;
import com.sportslobby.vendors.domain.VendorMemberRole;
import com.sportslobby.vendors.domain.VendorMemberStatus;
import com.sportslobby.vendors.domain.VendorVerificationSubmission;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VendorRepository {
    void createVendor(Vendor vendor);

    void createMember(UUID vendorId, UUID userId, VendorMemberRole role, VendorMemberStatus status, Instant now);

    void createSubmission(VendorVerificationSubmission submission);

    void createSubmissionDocument(UUID id, UUID submissionId, UUID fileId, VerificationDocumentType documentType, Instant now);

    Optional<Vendor> findById(UUID vendorId);

    Optional<Vendor> findByOwnerUserId(UUID userId);

    boolean isActiveMember(UUID vendorId, UUID userId);

    boolean ownsDocument(UUID vendorId, UUID fileId);

    List<Vendor> findPendingVendors();

    Optional<VendorVerificationSubmission> findLatestSubmission(UUID vendorId);

    void updateVendorVerificationStatus(UUID vendorId, VerificationStatus status, Instant approvedAt, Instant suspendedAt, Instant updatedAt);

    void reviewSubmission(UUID submissionId, String status, UUID adminUserId, String decisionReason, Instant reviewedAt);

    void createAuditEvent(UUID id, UUID actorUserId, String action, String targetType, UUID targetId, String reason, Instant createdAt);
}
