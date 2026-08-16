# API Design

## 1. Style

Initial external API: REST over HTTPS with JSON.

Base version example:

`/api/v1/...`

Do not expose persistence entities directly.

## 2. Resource examples

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/google
POST   /api/v1/auth/otp/request
POST   /api/v1/auth/otp/verify
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/password/forgot
POST   /api/v1/auth/password/reset
PATCH  /api/v1/me/unverified-phone
POST   /api/v1/vendors/signup
GET    /api/v1/vendor/me
GET    /api/v1/vendor/kyc
POST   /api/v1/vendor/verification/resubmit
POST   /api/v1/vendor/verification-documents/{fileId}/upload-url
POST   /api/v1/vendor/verification-documents/{fileId}/complete
GET    /api/v1/vendor/verification-documents/{fileId}/download

GET    /api/v1/sports
GET    /api/v1/venues
GET    /api/v1/venues/{venueId}
GET    /api/v1/lobbies
GET    /api/v1/lobbies/{lobbyId}
POST   /api/v1/lobbies/{lobbyId}/reservations
DELETE /api/v1/reservations/{reservationId}
GET    /api/v1/me/reservations

POST   /api/v1/vendor/venues
POST   /api/v1/vendor/courts
POST   /api/v1/vendor/court-images/upload-url
POST   /api/v1/vendor/court-images/{fileId}/complete
POST   /api/v1/vendor/lobbies
POST   /api/v1/vendor/lobbies/{id}/publish
POST   /api/v1/vendor/reservations/{id}/attendance

GET    /api/v1/admin/vendors/pending
POST   /api/v1/admin/vendors/{id}/approve
POST   /api/v1/admin/vendors/{id}/reject
POST   /api/v1/admin/vendors/{id}/suspend
POST   /api/v1/admin/vendors/{id}/reactivate
GET    /api/v1/admin/vendors/verification-documents/{fileId}/download
```

Exact endpoint naming can evolve while following these principles.

## 3. Request/response conventions

- Use ISO-8601 for date/time values.
- Include explicit currency code with monetary amounts.
- Use strings/decimal-safe representation for money; never binary floating-point semantics.
- IDs are opaque to clients.
- Enums are stable documented strings.

Example successful resource:

```json
{
  "id": "...",
  "sport": {"id": "...", "code": "FOOTBALL", "name": "Football"},
  "startsAt": "2026-08-14T17:00:00Z",
  "venueTimezone": "Asia/Amman",
  "minPlayers": 8,
  "maxPlayers": 12,
  "reservedPlayers": 7,
  "availableSeats": 5,
  "price": {"amount": "5.00", "currency": "JOD"},
  "status": "OPEN"
}
```

## 4. Errors

Return a consistent error envelope.

```json
{
  "error": {
    "code": "LOBBY_FULL",
    "message": "No seats are currently available.",
    "requestId": "...",
    "details": {}
  }
}
```

Error codes should be machine-readable and stable.

Important examples:
- VALIDATION_ERROR
- UNAUTHENTICATED
- FORBIDDEN
- RESOURCE_NOT_FOUND
- LOBBY_NOT_JOINABLE
- LOBBY_FULL
- ALREADY_RESERVED
- CANCELLATION_WINDOW_CLOSED
- ACCOUNT_RESTRICTED
- OUTSTANDING_BALANCE
- VENDOR_NOT_APPROVED
- PAYMENT_REQUIRED
- PAYMENT_FAILED
- RATE_LIMITED
- CONFLICT

Do not return stack traces or provider secrets.

## 5. HTTP semantics

- 200: successful read/update where applicable.
- 201: created resource.
- 204: successful action with no response body where useful.
- 400: malformed/validation issue.
- 401: unauthenticated.
- 403: authenticated but forbidden.
- 404: resource absent/not visible.
- 409: business concurrency/conflict such as last seat already taken.
- 422: optionally use for domain validation if the team standardizes it.
- 429: rate limited.
- 5xx: unexpected server/provider failure.

Pick one consistent validation strategy and test clients against it.

## 6. Pagination

Cursor pagination is preferred for feeds/time-ordered large collections; page pagination is acceptable for admin tables where jumping to pages matters.

Example cursor response:

```json
{
  "items": [],
  "nextCursor": "...",
  "hasMore": true
}
```

## 7. Filtering

Lobby query examples:

`GET /api/v1/lobbies?sportId=...&city=Amman&from=...&to=...&maxDistanceKm=10&minAvailableSeats=1&sort=RECOMMENDED`

Current discovery also accepts `search` for a bounded venue, area, or court-name match. Discovery responses include venue/court/sport display data and a short-lived `courtImageUrl`; clients must treat the URL as expiring media, not persistent identity.

Validate bounded ranges to prevent abusive queries.

## 8. Idempotency

Require/support idempotency keys for operations where retries could create financial or duplicate side effects:
- online payment creation/capture intent;
- refund request;
- possibly reservation creation if mobile retry behavior can duplicate requests;
- webhook/event handling.

Store idempotency outcome for a defined retention period.

## 9. Optimistic resource updates

For selected vendor/admin edits, support versioning/ETags if lost updates become a problem. Critical seat reservation should use a database transaction strategy, not only HTTP ETags.

## 10. Authentication headers

Use bearer access token:

`Authorization: Bearer <access-token>`

Refresh tokens should follow the selected secure mobile session model.

## 11. Authorization

API returns only data the caller may access.

Examples:
- Vendor A cannot read Vendor B private reservation customer data.
- Player cannot call vendor attendance endpoint.
- Admin actions require admin role and appropriate permission.

## 12. Webhooks

When online payments are enabled:
- verify provider signatures;
- process idempotently;
- store provider event ID;
- ignore/reject duplicate events safely;
- never trust client-only payment success.

## 13. Versioning

Use `/api/v1` initially. Avoid version bumps for additive optional fields. Version when a breaking contract change cannot be made backward-compatible.
