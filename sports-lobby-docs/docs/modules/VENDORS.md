# Module: Vendors and Verification

## Purpose
Represent sports-facility operators, manage onboarding/approval, members, and business-level operations.

## Vendor onboarding fields
Owner:
- first/last name;
- phone;
- email;
- password/auth identity.

Business:
- business/playground name;
- contact phone/email;
- registered business address for contact and verification, not venue discovery;
- facility images;
- sports supported;
- number of venues/courts informationally during onboarding;
- opening hours;
- business/license documents.

## Verification
Statuses: PENDING, APPROVED, REJECTED, SUSPENDED.

Requirements:
- preserve every submission/review decision;
- rejection includes reason;
- resubmission creates new history;
- admin reviewer recorded;
- private documents protected.

## Publishing rule
Only APPROVED vendor with valid active venue/court can publicly publish lobby.

Current implementation note:
- Vendor signup is available at `POST /api/v1/vendors/signup`.
- Signup creates a vendor owner account with the `VENDOR` role, business information, owner membership, a `PENDING` verification submission, private verification document metadata, and signed upload instructions.
- Vendor self business lookup is available at `GET /api/v1/vendor/me`.
- Vendor KYC state with the latest submission/reviewer reason is available at `GET /api/v1/vendor/kyc`.
- Rejected vendors resubmit new documents through `POST /api/v1/vendor/verification/resubmit`; this creates a new numbered submission and preserves earlier decisions.
- Admin suspension/reactivation transitions are audited and preserve a vendor-facing suspension reason.
- Mobile onboarding collects business contact/KYC information, a native opening/closing time range, business logo, facility image, and the private verification document. Overnight time ranges are supported and normalized before submission. Exact map locations belong to individual venues and are selected when each venue is created. All selected files use signed uploads with progress/retry behavior.
- A backend publishing guard rejects non-`APPROVED` vendors. Venue/court/lobby publishing endpoints are not implemented yet.

## Management/dashboard
Vendor should see:
- today's/upcoming lobbies;
- reservations;
- occupancy/utilization;
- cancellations;
- no-shows;
- revenue/booking values;
- popular sports/times;
- warnings/action items.

## Abuse
Repeated late cancellations or policy violations can create strikes/restrictions/suspension.

## Future
- staff accounts/permissions;
- payouts;
- subscriptions;
- promotions;
- multi-branch organizations.
