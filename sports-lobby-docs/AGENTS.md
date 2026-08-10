# AI Agent Instructions

These instructions apply to Codex and any other AI coding agent working in this repository.

## Mission

Build a production-quality sports lobby marketplace while preserving consistency across mobile, backend, database, APIs, security, and business rules.

The documentation in this repository is the source of truth. Do not silently invent product rules that contradict it.

## Required reading

Before any significant task, read:

1. This `AGENTS.md`.
2. `docs/INDEX.md`.
3. `docs/ARCHITECTURE.md`.
4. The relevant module file under `docs/modules/`.
5. Any canonical cross-cutting document referenced by that module, especially:
   - `docs/DATABASE.md`
   - `docs/BUSINESS_RULES.md`
   - `docs/STATE_MACHINES.md`
   - `docs/API_DESIGN.md`
   - `docs/AUTH_AND_SECURITY.md`

Do not read every document for every tiny task. Read the minimum set needed to maintain correctness.

## Source-of-truth precedence

If documents conflict, use this order and report the conflict:

1. Explicit task requirement from the user for the current change.
2. `docs/BUSINESS_RULES.md` and `docs/STATE_MACHINES.md` for domain behavior.
3. Module specification under `docs/modules/`.
4. `docs/DATABASE.md` for data ownership and relationships.
5. `docs/ARCHITECTURE.md` for system structure.
6. `docs/API_DESIGN.md` for API conventions.
7. `docs/CODING_STANDARDS.md` for implementation style.

Never resolve a major contradiction by guessing. Flag it and make the smallest safe choice.

## Architecture rules

- Start as a Spring Boot modular monolith, not microservices.
- Keep domain boundaries explicit so modules can be separated later if justified.
- PostgreSQL is the primary transactional database.
- AWS S3 stores object/file content; PostgreSQL stores metadata and references.
- REST is the initial external API style.
- Mobile is React Native with TypeScript.
- Backend is authoritative for permissions, prices, capacity, reservation state, penalties, and payment state.
- Never trust client-calculated capacity, price totals, permissions, or status transitions.
- External providers must be behind interfaces/adapters: SMS, maps/geocoding, payments, push, email, S3.
- Avoid distributed-system complexity until actual scale or operational constraints justify it.

## Domain rules that must never be bypassed

- A vendor cannot publicly publish lobbies before admin approval.
- A lobby cannot exceed `maxPlayers` even under simultaneous join attempts.
- Reservation state and payment state are separate.
- A user must not be penalized for vendor/platform cancellation or an underfilled lobby cancelled by policy.
- Online payments must be refunded when a platform/vendor cancellation requires it.
- Cancellation and penalty windows are configuration-driven, not scattered hardcoded values.
- Phone numbers are important verified contact identifiers but never database primary keys.
- Venue location stores structured place fields and coordinates.
- Venue time zone is explicit; timestamps are stored consistently using UTC where appropriate.
- Sports are data-driven; do not hardcode football/basketball/etc. into business logic.
- Important admin and moderation actions must be auditable.

## Workflow for significant features

Before coding:

1. Read the relevant documentation.
2. Inspect current code for related modules and reusable abstractions.
3. Restate the task in 3-8 implementation bullets.
4. Identify files likely to change.
5. Identify migrations/API contract changes.
6. Identify concurrency, authorization, validation, error, and rollback concerns.

During coding:

- Implement the smallest complete vertical slice.
- Reuse existing components/services when they are appropriate.
- Do not create speculative abstractions solely for hypothetical reuse.
- Keep controllers thin; business rules belong in domain/application services.
- Use explicit transactions for operations requiring atomicity.
- Add database constraints that reinforce critical invariants where possible.
- Keep migrations forward-safe and reversible where practical.

After coding:

1. Run formatting/linting.
2. Run type checks/compilation.
3. Run relevant unit/integration tests.
4. Review authorization and input validation.
5. Review database transaction boundaries.
6. Review race conditions for reservation/payment flows.
7. Review the diff for unrelated changes.
8. Update documentation when behavior/contracts changed.

## Definition of done

A task is not complete until:

- Functional requirements are met.
- Unauthorized paths are rejected server-side.
- Loading, empty, error, success, and retry states are handled where relevant.
- Validation exists on client for UX and server for correctness.
- Important business logic has tests.
- Database migrations are included when needed.
- API changes follow `docs/API_DESIGN.md`.
- No new secrets are committed.
- Logs do not expose passwords, tokens, OTP values, payment secrets, or private verification documents.
- Documentation is still accurate.

## Mobile rules

- Use strict TypeScript.
- Centralize design tokens, spacing, typography, radii, and colors.
- Centralize API access and authentication/session handling.
- Reusable UI should be genuinely reusable, not over-generic.
- Screens should compose smaller components rather than contain all logic.
- Keep server state and local UI state conceptually separate.
- Handle slow networks and retries gracefully.
- Never assume a reservation succeeded until the backend confirms it.

## Backend rules

- Use clear module/package boundaries.
- Prefer DTOs at API boundaries; do not expose persistence entities directly.
- Validate all externally supplied identifiers and fields.
- Implement authorization at service/controller boundaries as appropriate.
- Use optimistic/pessimistic locking or atomic SQL patterns intentionally for limited-capacity reservations; add concurrency tests.
- Use idempotency for payment creation/refund and other retry-prone financial operations.
- Use structured logging and correlation/request IDs.

## Database rules

- Use UUIDs or another non-business immutable identifier for primary IDs.
- Use foreign keys and constraints for critical integrity.
- Use `created_at` / `updated_at` consistently.
- Use soft deletion only where there is a clear product/legal need; do not make every table soft-deletable by default.
- Do not use a single mutable `balance` column as an accounting history. Use ledger transactions.
- Preserve historical booking/payment snapshots when future price/name changes would otherwise rewrite history.

## Security rules

- Never commit secrets or provider credentials.
- Hash passwords with an approved adaptive password hash.
- Store refresh tokens securely and support revocation/rotation.
- Apply rate limits to login, OTP, password reset, reservation attempts, reports, and other abuse-prone endpoints.
- Keep private vendor verification files non-public in S3 and deliver through controlled access.
- Use signed upload/download mechanisms where appropriate.
- Validate file type, size, and ownership.

## Prohibited shortcuts

Do not:

- Hardcode the 12-hour cancellation window in multiple places.
- Trust a client-provided price as authoritative.
- Trust a client-provided role.
- Mark a payment as paid based only on a client callback.
- Use phone number/email as primary database keys.
- Add microservices without an explicit architectural decision.
- Introduce a second database just because a feature could theoretically use one.
- Mix lobby status, reservation status, and payment status into one enum.
- Delete financial/audit history merely because a user deletes their account.
- generate hundreds of placeholder files with no implemented behavior.

## Documentation updates

When a decision changes a contract or domain rule, update the canonical document rather than copying the new rule into many places.

For major architecture decisions, add an ADR under `docs/adr/` using the existing template.
