# System Architecture

## 1. Architecture choice

Use a **modular monolith** for the Spring Boot backend.

Why:
- Initial scale is modest.
- Domain logic has many cross-module transactions: lobby + reservation + payment + notification.
- One deployable backend reduces operational overhead.
- Clear module boundaries preserve a future path to service extraction if justified.

Do not create microservices merely because the product may scale internationally later.

## 2. High-level topology

```text
React Native App
      |
      | HTTPS REST
      v
Spring Boot API
      |
      +-- Auth / Users
      +-- Vendors / Verification
      +-- Venues / Courts / Sports
      +-- Lobbies
      +-- Reservations / Attendance
      +-- Payments / Ledger
      +-- Notifications
      +-- Reviews / Reports
      +-- Analytics / Admin
      |
      +--> PostgreSQL
      +--> AWS S3
      +--> SMS/OTP provider
      +--> Push provider
      +--> Maps/geocoding provider
      +--> Payment provider(s)
      +--> Email provider (optional)
```

## 3. Backend module boundaries

Suggested package/modules:

```text
com.company.sportslobby
├── auth
├── users
├── vendors
├── venues
├── sports
├── lobbies
├── reservations
├── payments
├── notifications
├── moderation
├── analytics
├── admin
├── files
├── common
└── integrations
```

Each module should own:
- Domain/application services.
- Repositories for its aggregate/data ownership.
- API DTOs/controllers where appropriate.
- Tests.

Avoid a giant `service` package with unrelated classes.

## 4. Layering

Recommended pragmatic layering inside larger modules:

```text
api -> application -> domain -> persistence/integrations
```

Rules:
- Controllers map HTTP to use cases and should remain thin.
- Application services coordinate transactions/use cases.
- Domain rules should be explicit and testable.
- Persistence details should not leak into mobile API contracts.
- Integrations are behind ports/interfaces.

## 5. Mobile architecture

Suggested shape:

```text
mobile/src/
├── app/              # app bootstrap/navigation/providers
├── features/
│   ├── auth/
│   ├── discovery/
│   ├── venues/
│   ├── lobbies/
│   ├── reservations/
│   ├── profile/
│   ├── vendor/
│   └── admin/        # only if admin mobile exists; web admin may be better later
├── components/       # truly shared UI
├── services/         # API, auth/session, notifications, location
├── store/            # selected global client state only
├── theme/            # tokens/colors/type/radii
├── utils/
└── types/
```

Use a server-state library/pattern appropriate to the chosen React Native stack instead of copying all remote data into a global store.

## 6. Identity and authorization

- One `users` identity table for login/account-level concerns.
- Player/vendor/admin capabilities are represented through roles/profiles and authorization rules.
- A vendor account may manage a vendor organization/business, which may own multiple venues.
- Authorization must verify resource ownership, not only role names.

## 7. Data and transaction strategy

PostgreSQL is the source of truth for transactional state.

Critical operations requiring deliberate transactions:
- Reserving the final lobby seat.
- Cancelling and releasing capacity.
- Confirming attendance with penalty consequences.
- Online payment finalization/refund state updates.
- Vendor approval/suspension transitions.

Avoid eventual consistency for seat capacity in the initial architecture.

## 8. Reservation concurrency

The backend must guarantee:

`active_reserved_seats <= max_players`

Possible implementation approaches include:
- Pessimistic row lock on the lobby during join.
- Atomic conditional update/counter strategy.
- Serializable/appropriate transaction pattern with retry.

Choose one explicitly, test it under concurrent attempts, and document the exact implementation once selected.

Do not rely on counting rows in the mobile client.

## 9. Event model

Use domain/application events inside the monolith to decouple follow-up actions.

Examples:
- `LobbyPublished`
- `ReservationCreated`
- `LobbyBecameFull`
- `LobbyCancelled`
- `ReservationCancelled`
- `PaymentCaptured`
- `RefundCompleted`
- `VendorApproved`
- `NoShowRecorded`

For reliability-sensitive external effects, consider an **outbox pattern** when notifications/payments become production-critical. Do not introduce Kafka initially without a concrete need.

## 10. Files

AWS S3:
- Public/controlled media: venue/profile images.
- Private media: vendor verification/license documents.

Use separate prefixes/buckets/policies if useful. Private documents must not use public permanent URLs.

Preferred flow:
- Backend authorizes upload.
- Client receives signed upload request or uploads through controlled backend flow.
- Backend stores object key, owner, MIME type, size, purpose, timestamps.

## 11. Location

A venue stores:
- country code
- city
- area/locality
- human-readable address
- latitude
- longitude
- timezone

Nearby search should use database-supported geographic calculations initially. If geospatial complexity grows, PostgreSQL/PostGIS may be introduced through an ADR.

## 12. Time

- Persist instants/timestamps consistently in UTC when representing moments in time.
- Persist venue timezone (IANA identifier, e.g. `Asia/Amman`).
- Build lobby local schedule using venue timezone.
- Return ISO-8601 API timestamps.
- Mobile renders according to product UX rules/user device context.

## 13. External provider abstractions

Define internal interfaces such as:

- `OtpProvider`
- `PushNotificationProvider`
- `PaymentGateway`
- `MapGeocodingProvider`
- `ObjectStorageService`
- `EmailProvider`

Provider-specific request/response models should not leak deeply into the domain.

## 14. Caching

Do not start with complex distributed caching. Add cache only for demonstrated needs such as:
- sports/configuration lists
- popular venue/lobby discovery queries
- expensive analytics

Never use stale cache as the authority for seat availability.

## 15. Background jobs

Useful scheduled/asynchronous jobs:
- Expire stale draft/open lobbies.
- Confirm/cancel underfilled lobbies at deadlines.
- Send upcoming game reminders.
- Reconcile payment/refund states.
- Calculate aggregated statistics.
- Cleanup abandoned uploads.

Jobs must be idempotent and safe when retried.

## 16. Scaling path

Scale in this order:
1. Query/index optimization.
2. Horizontal backend instances.
3. Managed PostgreSQL scaling/read replicas where useful.
4. Redis/caching only when justified.
5. Durable job/outbox infrastructure.
6. Extract a service only when a module has independent scaling/ownership needs.

## 17. Admin surface

A separate web admin is likely better than placing full administration inside the consumer mobile app. This can be implemented later without changing core APIs. Keep admin APIs role-protected and auditable.
