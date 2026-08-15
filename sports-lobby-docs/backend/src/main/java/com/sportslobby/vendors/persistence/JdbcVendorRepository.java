package com.sportslobby.vendors.persistence;

import com.sportslobby.files.domain.FileAccessLevel;
import com.sportslobby.files.domain.FilePurpose;
import com.sportslobby.files.domain.FileRecord;
import com.sportslobby.files.domain.FileUploadStatus;
import com.sportslobby.vendors.domain.SubmissionStatus;
import com.sportslobby.vendors.domain.VerificationDocumentType;
import com.sportslobby.vendors.domain.VerificationStatus;
import com.sportslobby.vendors.domain.Vendor;
import com.sportslobby.vendors.domain.VendorMemberRole;
import com.sportslobby.vendors.domain.VendorMemberStatus;
import com.sportslobby.vendors.domain.VendorVerificationSubmission;
import com.sportslobby.vendors.domain.VerificationDocumentFile;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcVendorRepository implements VendorRepository {
    private final JdbcTemplate jdbcTemplate;

    public JdbcVendorRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void createVendor(Vendor vendor) {
        jdbcTemplate.update(
            """
            INSERT INTO vendors (
                id, owner_user_id, business_name, contact_phone, contact_email, country_code, city, area,
                address_line, latitude, longitude, supported_sports, venue_count_estimate, opening_hours,
                verification_status, status_reason, approved_at, suspended_at, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            vendor.id(),
            vendor.ownerUserId(),
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
            vendor.verificationStatus().name(),
            vendor.statusReason(),
            toTimestamp(vendor.approvedAt()),
            toTimestamp(vendor.suspendedAt()),
            Timestamp.from(vendor.createdAt()),
            Timestamp.from(vendor.updatedAt())
        );
    }

    @Override
    public void createMember(UUID vendorId, UUID userId, VendorMemberRole role, VendorMemberStatus status, Instant now) {
        jdbcTemplate.update(
            """
            INSERT INTO vendor_members (vendor_id, user_id, member_role, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            vendorId,
            userId,
            role.name(),
            status.name(),
            Timestamp.from(now),
            Timestamp.from(now)
        );
    }

    @Override
    public void createSubmission(VendorVerificationSubmission submission) {
        jdbcTemplate.update(
            """
            INSERT INTO vendor_verification_submissions (
                id, vendor_id, status, submitted_at, reviewed_at, reviewed_by_admin_user_id, decision_reason,
                submission_number, business_name_snapshot, contact_phone_snapshot, contact_email_snapshot,
                country_code_snapshot, city_snapshot, area_snapshot, address_line_snapshot, latitude_snapshot,
                longitude_snapshot, supported_sports_snapshot, venue_count_estimate_snapshot, opening_hours_snapshot,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            submission.id(),
            submission.vendorId(),
            submission.status().name(),
            Timestamp.from(submission.submittedAt()),
            toTimestamp(submission.reviewedAt()),
            submission.reviewedByAdminUserId(),
            submission.decisionReason(),
            submission.submissionNumber(),
            submission.businessNameSnapshot(),
            submission.contactPhoneSnapshot(),
            submission.contactEmailSnapshot(),
            submission.countryCodeSnapshot(),
            submission.citySnapshot(),
            submission.areaSnapshot(),
            submission.addressLineSnapshot(),
            submission.latitudeSnapshot(),
            submission.longitudeSnapshot(),
            submission.supportedSportsSnapshot(),
            submission.venueCountEstimateSnapshot(),
            submission.openingHoursSnapshot(),
            Timestamp.from(submission.createdAt()),
            Timestamp.from(submission.updatedAt())
        );
    }

    @Override
    public void createSubmissionDocument(UUID id, UUID submissionId, UUID fileId, VerificationDocumentType documentType, Instant now) {
        jdbcTemplate.update(
            """
            INSERT INTO vendor_verification_documents (id, submission_id, file_id, document_type, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            id,
            submissionId,
            fileId,
            documentType.name(),
            Timestamp.from(now)
        );
    }

    @Override
    public Optional<Vendor> findById(UUID vendorId) {
        return queryVendor("WHERE id = ?", vendorId);
    }

    @Override
    public Optional<Vendor> findByOwnerUserId(UUID userId) {
        return queryVendor("WHERE owner_user_id = ?", userId);
    }

    @Override
    public boolean isActiveMember(UUID vendorId, UUID userId) {
        Integer count = jdbcTemplate.queryForObject(
            """
            SELECT COUNT(*) FROM vendor_members
            WHERE vendor_id = ? AND user_id = ? AND status = 'ACTIVE'
            """,
            Integer.class,
            vendorId,
            userId
        );
        return count != null && count > 0;
    }

    @Override
    public boolean ownsDocument(UUID vendorId, UUID fileId) {
        Integer count = jdbcTemplate.queryForObject(
            """
            SELECT COUNT(*)
            FROM vendor_verification_documents d
            JOIN vendor_verification_submissions s ON s.id = d.submission_id
            WHERE s.vendor_id = ? AND d.file_id = ?
            """,
            Integer.class,
            vendorId,
            fileId
        );
        return count != null && count > 0;
    }

    @Override
    public List<Vendor> findPendingVendors() {
        return jdbcTemplate.query(
            """
            SELECT id, owner_user_id, business_name, contact_phone, contact_email, country_code, city, area,
                   address_line, latitude, longitude, supported_sports, venue_count_estimate, opening_hours,
                   verification_status, status_reason, approved_at, suspended_at, created_at, updated_at
            FROM vendors
            WHERE verification_status = 'PENDING'
            ORDER BY created_at ASC
            """,
            this::mapVendor
        );
    }

    @Override
    public Optional<VendorVerificationSubmission> findLatestSubmission(UUID vendorId) {
        return queryOptional(
            """
            SELECT id, vendor_id, status, submitted_at, reviewed_at, reviewed_by_admin_user_id, decision_reason,
                   submission_number, business_name_snapshot, contact_phone_snapshot, contact_email_snapshot,
                   country_code_snapshot, city_snapshot, area_snapshot, address_line_snapshot, latitude_snapshot,
                   longitude_snapshot, supported_sports_snapshot, venue_count_estimate_snapshot, opening_hours_snapshot,
                   created_at, updated_at
            FROM vendor_verification_submissions
            WHERE vendor_id = ?
            ORDER BY submission_number DESC
            LIMIT 1
            """,
            this::mapSubmission,
            vendorId
        );
    }

    @Override
    public List<VerificationDocumentFile> findSubmissionDocuments(UUID submissionId) {
        return jdbcTemplate.query(
            """
            SELECT d.id AS document_id, d.submission_id, d.document_type, d.created_at AS document_created_at,
                   f.id AS file_id, f.owner_user_id, f.owner_vendor_id, f.purpose, f.storage_provider,
                   f.bucket_name, f.object_key, f.original_file_name, f.content_type, f.size_bytes,
                   f.access_level, f.upload_status, f.created_at AS file_created_at, f.updated_at AS file_updated_at
            FROM vendor_verification_documents d
            JOIN files f ON f.id = d.file_id
            WHERE d.submission_id = ?
            ORDER BY d.created_at ASC
            """,
            (rs, rowNum) -> new VerificationDocumentFile(
                rs.getObject("document_id", UUID.class),
                rs.getObject("submission_id", UUID.class),
                VerificationDocumentType.valueOf(rs.getString("document_type")),
                new FileRecord(
                    rs.getObject("file_id", UUID.class),
                    rs.getObject("owner_user_id", UUID.class),
                    rs.getObject("owner_vendor_id", UUID.class),
                    FilePurpose.valueOf(rs.getString("purpose")),
                    rs.getString("storage_provider"),
                    rs.getString("bucket_name"),
                    rs.getString("object_key"),
                    rs.getString("original_file_name"),
                    rs.getString("content_type"),
                    rs.getLong("size_bytes"),
                    FileAccessLevel.valueOf(rs.getString("access_level")),
                    FileUploadStatus.valueOf(rs.getString("upload_status")),
                    toInstant(rs.getTimestamp("file_created_at")),
                    toInstant(rs.getTimestamp("file_updated_at"))
                ),
                toInstant(rs.getTimestamp("document_created_at"))
            ),
            submissionId
        );
    }

    @Override
    public void replaceSubmissionDocumentFile(UUID documentId, UUID oldFileId, UUID newFileId) {
        int updated = jdbcTemplate.update(
            "UPDATE vendor_verification_documents SET file_id = ? WHERE id = ? AND file_id = ?",
            newFileId,
            documentId,
            oldFileId
        );
        if (updated != 1) {
            throw new IllegalStateException("Verification document changed while its upload was being replaced.");
        }
    }

    @Override
    public void updateVendorVerificationStatus(
        UUID vendorId,
        VerificationStatus status,
        String statusReason,
        Instant approvedAt,
        Instant suspendedAt,
        Instant updatedAt
    ) {
        jdbcTemplate.update(
            """
            UPDATE vendors
            SET verification_status = ?, status_reason = ?, approved_at = ?, suspended_at = ?, updated_at = ?
            WHERE id = ?
            """,
            status.name(),
            statusReason,
            toTimestamp(approvedAt),
            toTimestamp(suspendedAt),
            Timestamp.from(updatedAt),
            vendorId
        );
    }

    @Override
    public boolean reviewSubmission(UUID submissionId, String status, UUID adminUserId, String decisionReason, Instant reviewedAt) {
        return jdbcTemplate.update(
            """
            UPDATE vendor_verification_submissions
            SET status = ?, reviewed_by_admin_user_id = ?, decision_reason = ?, reviewed_at = ?, updated_at = ?
            WHERE id = ? AND status = 'PENDING'
            """,
            status,
            adminUserId,
            decisionReason,
            Timestamp.from(reviewedAt),
            Timestamp.from(reviewedAt),
            submissionId
        ) == 1;
    }

    @Override
    public void createAuditEvent(UUID id, UUID actorUserId, String action, String targetType, UUID targetId, String reason, Instant createdAt) {
        jdbcTemplate.update(
            """
            INSERT INTO admin_audit_events (id, actor_user_id, action, target_type, target_id, reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            id,
            actorUserId,
            action,
            targetType,
            targetId,
            reason,
            Timestamp.from(createdAt)
        );
    }

    private Optional<Vendor> queryVendor(String whereClause, Object parameter) {
        return queryOptional(
            """
            SELECT id, owner_user_id, business_name, contact_phone, contact_email, country_code, city, area,
                   address_line, latitude, longitude, supported_sports, venue_count_estimate, opening_hours,
                   verification_status, status_reason, approved_at, suspended_at, created_at, updated_at
            FROM vendors
            """ + whereClause,
            this::mapVendor,
            parameter
        );
    }

    private Vendor mapVendor(ResultSet rs, int rowNum) throws SQLException {
        return new Vendor(
            rs.getObject("id", UUID.class),
            rs.getObject("owner_user_id", UUID.class),
            rs.getString("business_name"),
            rs.getString("contact_phone"),
            rs.getString("contact_email"),
            rs.getString("country_code"),
            rs.getString("city"),
            rs.getString("area"),
            rs.getString("address_line"),
            rs.getBigDecimal("latitude"),
            rs.getBigDecimal("longitude"),
            rs.getString("supported_sports"),
            (Integer) rs.getObject("venue_count_estimate"),
            rs.getString("opening_hours"),
            VerificationStatus.valueOf(rs.getString("verification_status")),
            rs.getString("status_reason"),
            toInstant(rs.getTimestamp("approved_at")),
            toInstant(rs.getTimestamp("suspended_at")),
            toInstant(rs.getTimestamp("created_at")),
            toInstant(rs.getTimestamp("updated_at"))
        );
    }

    private VendorVerificationSubmission mapSubmission(ResultSet rs, int rowNum) throws SQLException {
        return new VendorVerificationSubmission(
            rs.getObject("id", UUID.class),
            rs.getObject("vendor_id", UUID.class),
            SubmissionStatus.valueOf(rs.getString("status")),
            toInstant(rs.getTimestamp("submitted_at")),
            toInstant(rs.getTimestamp("reviewed_at")),
            rs.getObject("reviewed_by_admin_user_id", UUID.class),
            rs.getString("decision_reason"),
            rs.getInt("submission_number"),
            rs.getString("business_name_snapshot"),
            rs.getString("contact_phone_snapshot"),
            rs.getString("contact_email_snapshot"),
            rs.getString("country_code_snapshot"),
            rs.getString("city_snapshot"),
            rs.getString("area_snapshot"),
            rs.getString("address_line_snapshot"),
            rs.getBigDecimal("latitude_snapshot"),
            rs.getBigDecimal("longitude_snapshot"),
            rs.getString("supported_sports_snapshot"),
            (Integer) rs.getObject("venue_count_estimate_snapshot"),
            rs.getString("opening_hours_snapshot"),
            toInstant(rs.getTimestamp("created_at")),
            toInstant(rs.getTimestamp("updated_at"))
        );
    }

    private <T> Optional<T> queryOptional(String sql, org.springframework.jdbc.core.RowMapper<T> mapper, Object... args) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, mapper, args));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    private Timestamp toTimestamp(Instant instant) {
        return instant == null ? null : Timestamp.from(instant);
    }
}
