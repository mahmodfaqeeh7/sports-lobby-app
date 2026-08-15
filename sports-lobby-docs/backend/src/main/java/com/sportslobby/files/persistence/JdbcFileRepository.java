package com.sportslobby.files.persistence;

import com.sportslobby.files.domain.FileAccessLevel;
import com.sportslobby.files.domain.FilePurpose;
import com.sportslobby.files.domain.FileRecord;
import com.sportslobby.files.domain.FileUploadStatus;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcFileRepository implements FileRepository {
    private final JdbcTemplate jdbcTemplate;

    public JdbcFileRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void create(FileRecord file) {
        jdbcTemplate.update(
            """
            INSERT INTO files (
                id, owner_user_id, owner_vendor_id, purpose, storage_provider, bucket_name, object_key,
                original_file_name, content_type, size_bytes, access_level, upload_status, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            file.id(),
            file.ownerUserId(),
            file.ownerVendorId(),
            file.purpose().name(),
            file.storageProvider(),
            file.bucketName(),
            file.objectKey(),
            file.originalFileName(),
            file.contentType(),
            file.sizeBytes(),
            file.accessLevel().name(),
            file.uploadStatus().name(),
            Timestamp.from(file.createdAt()),
            Timestamp.from(file.updatedAt())
        );
    }

    @Override
    public Optional<FileRecord> findById(UUID fileId) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                """
                SELECT id, owner_user_id, owner_vendor_id, purpose, storage_provider, bucket_name, object_key,
                       original_file_name, content_type, size_bytes, access_level, upload_status, created_at, updated_at
                FROM files
                WHERE id = ?
                """,
                this::mapFile,
                fileId
            ));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    @Override
    public void markUploaded(UUID fileId, Instant uploadedAt) {
        jdbcTemplate.update(
            "UPDATE files SET upload_status = 'UPLOADED', updated_at = ? WHERE id = ? AND upload_status = 'PENDING_UPLOAD'",
            Timestamp.from(uploadedAt),
            fileId
        );
    }

    @Override
    public void markAbandoned(UUID fileId, Instant abandonedAt) {
        jdbcTemplate.update(
            "UPDATE files SET upload_status = 'ABANDONED', updated_at = ? WHERE id = ? AND upload_status = 'PENDING_UPLOAD'",
            Timestamp.from(abandonedAt),
            fileId
        );
    }

    private FileRecord mapFile(ResultSet rs, int rowNum) throws SQLException {
        return new FileRecord(
            rs.getObject("id", UUID.class),
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
            toInstant(rs.getTimestamp("created_at")),
            toInstant(rs.getTimestamp("updated_at"))
        );
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }
}
