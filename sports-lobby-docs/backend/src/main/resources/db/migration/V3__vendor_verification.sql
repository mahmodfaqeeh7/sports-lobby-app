CREATE TABLE files (
    id UUID PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    owner_vendor_id UUID,
    purpose VARCHAR(60) NOT NULL,
    storage_provider VARCHAR(30) NOT NULL,
    bucket_name VARCHAR(120) NOT NULL,
    object_key VARCHAR(500) NOT NULL UNIQUE,
    original_file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT NOT NULL,
    access_level VARCHAR(30) NOT NULL,
    upload_status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT files_purpose_check CHECK (purpose IN ('VENDOR_VERIFICATION_DOCUMENT')),
    CONSTRAINT files_access_level_check CHECK (access_level IN ('PRIVATE', 'PUBLIC')),
    CONSTRAINT files_upload_status_check CHECK (upload_status IN ('PENDING_UPLOAD', 'UPLOADED', 'ABANDONED')),
    CONSTRAINT files_size_check CHECK (size_bytes > 0 AND size_bytes <= 10485760)
);

CREATE TABLE vendors (
    id UUID PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    business_name VARCHAR(180) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    country_code CHAR(2) NOT NULL,
    city VARCHAR(120) NOT NULL,
    area VARCHAR(120),
    address_line VARCHAR(255) NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    supported_sports TEXT,
    venue_count_estimate INTEGER,
    opening_hours TEXT,
    verification_status VARCHAR(30) NOT NULL,
    approved_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vendors_owner_unique UNIQUE (owner_user_id),
    CONSTRAINT vendors_status_check CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    CONSTRAINT vendors_contact_phone_check CHECK (contact_phone ~ '^\+[1-9][0-9]{7,14}$'),
    CONSTRAINT vendors_latitude_check CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    CONSTRAINT vendors_longitude_check CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
    CONSTRAINT vendors_venue_count_check CHECK (venue_count_estimate IS NULL OR venue_count_estimate >= 0)
);

ALTER TABLE files
    ADD CONSTRAINT files_owner_vendor_fk FOREIGN KEY (owner_vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT;

CREATE INDEX vendors_status_idx ON vendors (verification_status);

CREATE TABLE vendor_members (
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_role VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (vendor_id, user_id),
    CONSTRAINT vendor_members_role_check CHECK (member_role IN ('OWNER', 'MANAGER', 'STAFF')),
    CONSTRAINT vendor_members_status_check CHECK (status IN ('ACTIVE', 'INVITED', 'REMOVED'))
);

CREATE TABLE vendor_verification_submissions (
    id UUID PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL,
    reviewed_at TIMESTAMPTZ,
    reviewed_by_admin_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    decision_reason VARCHAR(1000),
    submission_number INTEGER NOT NULL,
    business_name_snapshot VARCHAR(180) NOT NULL,
    contact_phone_snapshot VARCHAR(20) NOT NULL,
    contact_email_snapshot VARCHAR(255) NOT NULL,
    country_code_snapshot CHAR(2) NOT NULL,
    city_snapshot VARCHAR(120) NOT NULL,
    area_snapshot VARCHAR(120),
    address_line_snapshot VARCHAR(255) NOT NULL,
    latitude_snapshot NUMERIC(9, 6),
    longitude_snapshot NUMERIC(9, 6),
    supported_sports_snapshot TEXT,
    venue_count_estimate_snapshot INTEGER,
    opening_hours_snapshot TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vendor_verification_submissions_unique_number UNIQUE (vendor_id, submission_number),
    CONSTRAINT vendor_verification_submissions_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT vendor_verification_submissions_rejection_reason_check CHECK (
        status <> 'REJECTED' OR (decision_reason IS NOT NULL AND LENGTH(TRIM(decision_reason)) > 0)
    )
);

CREATE INDEX vendor_verification_submissions_vendor_idx
    ON vendor_verification_submissions (vendor_id, submission_number DESC);

CREATE TABLE vendor_verification_documents (
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES vendor_verification_submissions(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
    document_type VARCHAR(60) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vendor_verification_documents_file_unique UNIQUE (file_id),
    CONSTRAINT vendor_verification_documents_type_check CHECK (document_type IN ('BUSINESS_LICENSE', 'OWNER_ID', 'FACILITY_PHOTO', 'OTHER'))
);

CREATE TABLE admin_audit_events (
    id UUID PRIMARY KEY,
    actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(80) NOT NULL,
    target_id UUID NOT NULL,
    reason VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX admin_audit_events_target_idx ON admin_audit_events (target_type, target_id, created_at DESC);
