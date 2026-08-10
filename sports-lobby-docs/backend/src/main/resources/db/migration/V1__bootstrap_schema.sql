CREATE TABLE app_metadata (
    id UUID PRIMARY KEY,
    metadata_key VARCHAR(100) NOT NULL UNIQUE,
    metadata_value VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_metadata (id, metadata_key, metadata_value)
VALUES ('00000000-0000-0000-0000-000000000001', 'schema.bootstrap', '1');
