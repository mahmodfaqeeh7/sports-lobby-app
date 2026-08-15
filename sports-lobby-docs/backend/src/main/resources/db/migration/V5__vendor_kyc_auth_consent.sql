ALTER TABLE vendors
    ADD COLUMN status_reason VARCHAR(1000);

ALTER TABLE vendor_verification_documents
    DROP CONSTRAINT vendor_verification_documents_type_check;

ALTER TABLE vendor_verification_documents
    ADD CONSTRAINT vendor_verification_documents_type_check
    CHECK (document_type IN ('BUSINESS_LICENSE', 'OWNER_ID', 'FACILITY_PHOTO', 'BUSINESS_LOGO', 'OTHER'));

CREATE TABLE user_legal_consents (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(30) NOT NULL,
    document_version VARCHAR(40) NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT user_legal_consents_type_check CHECK (document_type IN ('TERMS_OF_SERVICE', 'PRIVACY_POLICY')),
    CONSTRAINT user_legal_consents_unique_version UNIQUE (user_id, document_type, document_version)
);

CREATE INDEX user_legal_consents_user_idx
    ON user_legal_consents (user_id, accepted_at DESC);

CREATE TABLE external_identities (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT external_identities_provider_check CHECK (provider IN ('GOOGLE')),
    CONSTRAINT external_identities_provider_subject_unique UNIQUE (provider, provider_subject)
);

CREATE INDEX external_identities_user_idx ON external_identities (user_id);
