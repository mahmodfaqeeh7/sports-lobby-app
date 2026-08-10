# Module: Vendor Verification (KYC / KYB)

## Purpose
Verify that a vendor/business is legitimate enough to publish public sports lobbies.

This is the platform's vendor verification/KYB-style flow. Normal players do not require equivalent business KYC in the initial product; they require account/phone verification.

## Submission data
Owner/business onboarding may collect:
- owner name;
- verified phone;
- email;
- business/playground name;
- contact information;
- address/country/city/area;
- exact map coordinates;
- facility images;
- supported sports;
- number of venues/courts informationally;
- opening hours;
- business/license documents.

## Statuses
- PENDING
- APPROVED
- REJECTED
- SUSPENDED

## Flow
1. Vendor creates account.
2. Vendor provides required business data/documents.
3. Submission is frozen/versioned for review.
4. Admin reviews.
5. Admin approves or rejects with reason.
6. Rejected vendor may correct information and resubmit as a new submission/history record.
7. Approved vendor gains publishing capability.
8. Serious policy issues can later move vendor to SUSPENDED without deleting history.

## Admin review
Display:
- submission data;
- private documents through authorized signed access;
- previous submissions/decisions;
- reviewer action with required reason for rejection/suspension.

## Rules
- vendor cannot publish before APPROVED;
- approval/rejection/suspension is audited;
- never overwrite previous verification decisions;
- document access is restricted;
- changing material verified business identity may require re-review according to future policy.

## Acceptance criteria
- unapproved vendor publish request is rejected server-side;
- private docs cannot be accessed by unrelated users/vendors;
- every admin decision has reviewer/timestamp/reason/history.

Current implementation note:
- Initial signup creates submission number `1` with status `PENDING`.
- Admin review endpoints are `GET /api/v1/admin/vendors/pending`, `POST /api/v1/admin/vendors/{vendorId}/approve`, and `POST /api/v1/admin/vendors/{vendorId}/reject`.
- Rejection requires a reason. Approval/rejection records reviewer, timestamp, reason, and an audit event.
- Vendor-owned document downloads use `GET /api/v1/vendor/verification-documents/{fileId}/download`; admin document downloads use `GET /api/v1/admin/vendors/verification-documents/{fileId}/download`.
- Resubmission after rejection is still future work.
