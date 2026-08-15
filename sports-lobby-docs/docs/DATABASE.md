# Database Design

This is the canonical logical model. Exact physical column types and migration names may evolve, but relationships/invariants should remain consistent unless an ADR changes them.

## 1. Identity

### users
- `id` UUID PK
- `first_name`
- `last_name`
- `email` nullable/unique when present
- `phone_e164` unique when present
- `phone_verified_at`
- `email_verified_at`
- `password_hash` nullable for provider-only accounts
- `status` (ACTIVE, RESTRICTED, SUSPENDED, DELETED as policy evolves)
- `preferred_locale`
- `created_at`
- `updated_at`

Do not use phone/email as PK.

### user_roles
Supports PLAYER, VENDOR, ADMIN without forcing mutually exclusive roles.

- `user_id` FK
- `role`
- unique `(user_id, role)`

### external_identities
For Google and future providers.

- `id`
- `user_id`
- `provider`
- `provider_subject`
- metadata needed for account linking
- unique `(provider, provider_subject)`

### user_legal_consents
- immutable acceptance record per user, legal document type, and version
- accepted timestamp
- unique `(user_id, document_type, document_version)`

### refresh_sessions
- `id`
- `user_id`
- hashed/secure refresh token reference
- device metadata
- `expires_at`
- `revoked_at`
- `created_at`

## 2. Player profile

### player_profiles
- `user_id` PK/FK
- `display_name` optional
- `profile_image_file_id` optional
- `home_country_code`
- `home_city` optional
- optional preferences
- `created_at`, `updated_at`

### player_sport_preferences
- `player_id`
- `sport_id`
- optional preference level
- unique pair

### favorites
Initial scope may support favorite venues.
- `user_id`
- `venue_id`
- `created_at`
- unique pair

## 3. Vendor and verification

### vendors
Represents the business/operator, not a location.

- `id`
- `owner_user_id` FK initially; future multiple staff via vendor_members
- `business_name`
- `contact_phone`
- `contact_email`
- `verification_status`
- `approved_at`
- `suspended_at`
- `created_at`, `updated_at`

### vendor_members
Allows future managers/staff.
- `vendor_id`
- `user_id`
- `member_role` (OWNER, MANAGER, STAFF)
- status/timestamps

### vendor_verification_submissions
Never overwrite history.
- `id`
- `vendor_id`
- `status`
- `submitted_at`
- `reviewed_at`
- `reviewed_by_admin_user_id`
- `decision_reason`
- version/submission number

### vendor_verification_documents
- `submission_id`
- `file_id`
- `document_type`

## 4. Geography and venues

### venues
- `id`
- `vendor_id`
- `name`
- `description`
- `country_code`
- `city`
- `area`
- `address_line`
- `latitude`
- `longitude`
- `timezone` IANA identifier
- `contact_phone`
- `status` (DRAFT, ACTIVE, INACTIVE, SUSPENDED)
- `created_at`, `updated_at`

Indexes:
- vendor/status
- city/status
- coordinates/geospatial strategy as adopted

### venue_images
- `id`
- `venue_id`
- `file_id`
- `sort_order`
- `is_cover`

### venue_opening_hours
- `venue_id`
- `day_of_week`
- `opens_local_time`
- `closes_local_time`
- optional closed flag

Support future exceptions/holiday hours via a separate schedule-exception table.

## 5. Sports and courts

### sports
Admin-managed.
- `id`
- `code` stable unique code
- `name`
- `icon_file_id` optional
- `is_active`
- optional configuration metadata

### courts
- `id`
- `venue_id`
- `name`
- `description`
- `status`
- optional default capacity
- created/updated timestamps

### court_sports
Many-to-many if a court supports several sports.
- `court_id`
- `sport_id`
- optional sport-specific capacity/config
- unique pair

## 6. Lobbies

### lobbies
- `id`
- `vendor_id` (denormalized ownership convenience; court/venue still authoritative)
- `venue_id`
- `court_id`
- `sport_id`
- `status`
- `starts_at` UTC instant
- `ends_at` UTC instant
- `venue_timezone_snapshot`
- `min_players`
- `max_players`
- `reserved_seat_count` if chosen as a protected counter
- `pricing_model` (TOTAL_COURT_PRICE, PRICE_PER_PLAYER)
- `currency_code`
- `total_court_price` nullable
- `price_per_seat` nullable/derived/snapshotted according to pricing policy
- `description`
- optional `skill_level`
- optional `gender_policy`
- optional `min_age`, `max_age`
- `cancellation_deadline_at`
- `confirmation_deadline_at`
- `published_at`
- `confirmed_at`
- `cancelled_at`
- `cancellation_reason_code`
- `created_at`, `updated_at`
- optional version column for optimistic locking

Constraints:
- `min_players > 0`
- `max_players >= min_players`
- `ends_at > starts_at`
- price fields valid for chosen pricing model
- currency required when price exists

Important: if `reserved_seat_count` is used, its update must be transactionally consistent with active reservations.

## 7. Reservations

### reservations
- `id`
- `lobby_id`
- `user_id`
- `status`
- `seat_count` initial default 1; keep only if group booking is planned
- `unit_price_snapshot`
- `currency_code_snapshot`
- `reserved_at`
- `cancelled_at`
- `cancellation_actor` USER/VENDOR/ADMIN/SYSTEM
- `cancellation_reason_code`
- `attendance_status` or separate attendance entity
- timestamps

Recommended uniqueness/invariant:
- At most one active reservation per `(lobby_id, user_id)` for initial one-seat-per-user behavior.

Historical price snapshots are required so later price edits do not rewrite history.

### reservation_events
Optional but valuable history.
- `reservation_id`
- event type
- actor
- metadata
- occurred_at

## 8. Attendance and no-shows

### attendance_records
- `reservation_id` unique
- `status` (ATTENDED, NO_SHOW, EXCUSED, UNKNOWN)
- `reported_by_user_id`
- `reported_at`
- `finalized_at`
- optional dispute status

### disputes
Could later generalize.
- subject type/id
- opened_by
- reason
- status
- resolution
- admin resolver
- timestamps

## 9. Payments and ledger

### payments
One reservation may have one or several payment attempts.
- `id`
- `reservation_id`
- `user_id`
- `provider`
- `method` (CASH, CARD, APPLE_PAY, etc.)
- `status`
- `amount`
- `currency_code`
- provider reference
- idempotency key
- created/updated/completed timestamps

### refunds
- `id`
- `payment_id`
- `amount`
- `status`
- provider reference
- reason code
- idempotency key
- timestamps

### wallets
Optional account-level wallet/credit container.
- `id`
- `user_id` unique
- currency policy must be explicit before multi-currency wallet use

### wallet_transactions
Ledger; never treat a single balance field as history.
- `id`
- `wallet_id`
- `type` (CREDIT, DEBIT, PENALTY, REFUND, ADJUSTMENT, PAYMENT)
- `amount`
- `currency_code`
- reference type/id
- reason
- created_at

A cached balance may exist only if it is derivable/reconcilable from the ledger.

## 10. Penalties/restrictions

### policy_strikes
- `id`
- `user_id` or vendor_id subject strategy
- `type`
- `severity`
- source/reference
- `expires_at` optional
- `created_at`

### account_restrictions
- `id`
- subject user/vendor
- restriction type
- starts_at
- ends_at
- reason
- issued_by
- status

## 11. Reviews and reports

### venue_reviews
- `id`
- `venue_id`
- `user_id`
- `reservation_id` recommended eligibility proof
- rating
- text
- moderation status
- timestamps
- unique review per eligible reservation policy

### reports
- `id`
- reporter_user_id
- target_type (USER, VENDOR, VENUE, LOBBY, REVIEW, etc.)
- target_id
- category
- details
- status
- assigned_admin_id
- resolution
- timestamps

## 12. Notifications

### notifications
In-app notification record.
- `id`
- `user_id`
- `type`
- title/body or template reference
- payload JSON with safe navigation identifiers
- `read_at`
- `created_at`

### notification_preferences
- `user_id`
- channel/type preferences
- do not allow disabling security-critical messages where legally/product-required

### push_devices
- `id`
- `user_id`
- platform
- push token
- last_seen_at
- revoked_at

## 13. Files

### files
- `id`
- `owner_user_id` nullable depending on owner model
- `bucket`
- `object_key`
- `visibility` (PUBLIC_MEDIA, PRIVATE)
- `mime_type`
- `size_bytes`
- `purpose`
- checksum optional
- timestamps

Do not expose private verification document object keys as public URLs.

## 14. Admin and audit

### audit_logs
- `id`
- actor_user_id
- action
- target_type
- target_id
- metadata (avoid secrets/private full documents)
- IP/device context as policy permits
- occurred_at

### system_settings
For configuration-driven policies.
- `key` unique
- typed value / JSON value
- version
- changed_by
- changed_at

Examples:
- cancellation window hours
- confirmation lead time
- no-show strike thresholds
- reminder offsets
- vendor late-cancellation thresholds

## 15. Analytics

Do not over-normalize dashboards into core transactional tables. Start from reliable transactional data and add aggregation tables/materialized views only when needed.

Potential daily aggregates:
- venue occupancy
- vendor revenue
- sport reservations
- city activity
- cancellation/no-show rates

## 16. Deletion and retention

- Account deletion should deactivate/anonymize as appropriate without destroying reservation/payment/audit integrity.
- Financial records, moderation decisions, and audit history may need retention independent of profile deletion.
- Exact legal retention policy is an open compliance decision before production launch.
