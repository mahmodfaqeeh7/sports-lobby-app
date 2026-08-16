ALTER TABLE files
    DROP CONSTRAINT files_purpose_check;

ALTER TABLE files
    ADD CONSTRAINT files_purpose_check
    CHECK (purpose IN ('VENDOR_VERIFICATION_DOCUMENT', 'COURT_IMAGE'));

ALTER TABLE courts
    ADD COLUMN image_file_id UUID REFERENCES files(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX courts_image_file_unique_idx
    ON courts (image_file_id)
    WHERE image_file_id IS NOT NULL;
