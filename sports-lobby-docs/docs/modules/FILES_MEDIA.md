# Module: Files and Media

## Purpose
Handle profile images, venue images, and private vendor verification documents using AWS S3.

## File categories
- player profile image;
- venue gallery/cover image;
- vendor business/license verification document;
- future report/dispute attachment.

## Storage rules
- binary content lives in S3;
- PostgreSQL stores metadata/object key/ownership/purpose;
- private verification documents are never permanently public;
- public venue media may use controlled public/CDN delivery according to deployment design.

## Upload flow
1. Authenticate user.
2. Validate user may upload for the target purpose/resource.
3. Validate expected size/type.
4. Generate signed upload or controlled backend upload.
5. Finalize metadata after upload is confirmed.
6. Associate file to venue/profile/submission.

## Security
- random/non-guessable object keys do not replace authorization;
- short-lived signed URLs for private downloads;
- MIME and extension checks;
- image transformation/thumbnailing may be added later;
- malware scanning may be added for uploaded documents when production risk warrants it.

## Cleanup
Background process may remove abandoned/unreferenced temporary uploads after a safe retention window.

Current implementation note:
- Vendor signup and rejected-application resubmission create private `VENDOR_VERIFICATION_DOCUMENT` file metadata and signed upload instructions through an `ObjectStorageService` abstraction.
- Onboarding accepts a business license, business logo, and facility image. They remain controlled submission assets during KYC; publishing them as a public venue gallery remains a distinct approved-vendor media operation.
- The mobile client selects PDF/JPEG/PNG files, enforces a 5 MB limit, copies provider-backed files to a readable cache location, and uploads the raw bytes with progress to the returned signed `PUT` URL.
- The local development storage adapter issues expiring, unguessable upload/download URLs and stores binary content under `SPORTS_LOBBY_LOCAL_FILE_STORAGE_PATH`; PostgreSQL stores metadata only.
- Successful uploads change the file metadata from `PENDING_UPLOAD` to `UPLOADED`.
- Private verification document downloads are authorized server-side before a signed download URL is returned.
