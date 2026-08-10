DROP TABLE IF EXISTS admin_audit_events;
DROP TABLE IF EXISTS vendor_verification_documents;
DROP TABLE IF EXISTS vendor_verification_submissions;
DROP TABLE IF EXISTS vendor_members;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS vendors;

CREATE TABLE vendors (
    id UUID PRIMARY KEY,
    owner_user_id UUID NOT NULL,
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
    approved_at TIMESTAMP,
    suspended_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vendors_owner_unique UNIQUE (owner_user_id)
);

CREATE TABLE files (
    id UUID PRIMARY KEY,
    owner_user_id UUID NOT NULL,
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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_members (
    vendor_id UUID NOT NULL,
    user_id UUID NOT NULL,
    member_role VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (vendor_id, user_id)
);

CREATE TABLE vendor_verification_submissions (
    id UUID PRIMARY KEY,
    vendor_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL,
    submitted_at TIMESTAMP NOT NULL,
    reviewed_at TIMESTAMP,
    reviewed_by_admin_user_id UUID,
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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_verification_documents (
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL,
    file_id UUID NOT NULL,
    document_type VARCHAR(60) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_audit_events (
    id UUID PRIMARY KEY,
    actor_user_id UUID NOT NULL,
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(80) NOT NULL,
    target_id UUID NOT NULL,
    reason VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
