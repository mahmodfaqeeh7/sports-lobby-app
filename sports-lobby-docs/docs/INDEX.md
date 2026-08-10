# Documentation Index and Ownership

This file explains what each document owns. Avoid duplicating canonical rules across many files.

## Canonical documents

| Document | Owns |
|---|---|
| `PRODUCT_REQUIREMENTS.md` | Product vision, personas, primary journeys, MVP scope |
| `ARCHITECTURE.md` | System structure, module boundaries, runtime topology |
| `DATABASE.md` | Entities, relationships, constraints, indexes, historical data strategy |
| `BUSINESS_RULES.md` | Cancellation, penalties, refunds, verification, policy behavior |
| `CONFIGURATION.md` | Tunable platform/business-policy settings |
| `STATE_MACHINES.md` | Legal lifecycle states/transitions |
| `API_DESIGN.md` | REST conventions, errors, pagination, idempotency, versioning |
| `AUTH_AND_SECURITY.md` | Authentication, RBAC, session/token security, abuse controls |
| `PAYMENTS.md` | Money flows, payment/refund semantics, ledger principles |
| `NOTIFICATIONS.md` | Notification events/channels/preferences |
| `DESIGN_SYSTEM.md` | UI/UX foundations and reusable component principles |
| `CODING_STANDARDS.md` | Code conventions and repo quality rules |
| `TESTING.md` | Test strategy and critical scenarios |
| `DEPLOYMENT.md` | Environments, CI/CD, migrations, secrets, rollback |
| `OBSERVABILITY.md` | Logging, metrics, alerts, tracing/correlation |
| `ROADMAP.md` | Version sequencing and future scope |
| `OPEN_QUESTIONS.md` | Decisions intentionally not finalized |

## Module documents

`docs/modules/` explains behavior and acceptance criteria for each product/module boundary. Module documents should reference canonical documents rather than redefine cross-cutting policy.

## Suggested reading by task

### Authentication
Read:
- `AUTH_AND_SECURITY.md`
- `API_DESIGN.md`
- `modules/AUTH.md`
- relevant user/vendor module

### Lobby creation
Read:
- `BUSINESS_RULES.md`
- `STATE_MACHINES.md`
- `DATABASE.md`
- `modules/LOBBIES.md`
- `modules/VENUES.md`

### Joining a lobby
Read:
- `BUSINESS_RULES.md`
- `STATE_MACHINES.md`
- `DATABASE.md`
- `modules/RESERVATIONS.md`
- `modules/LOBBIES.md`
- `PAYMENTS.md` if online payment is involved

### Vendor management/dashboard
Read:
- `modules/VENDORS.md`
- `modules/VENUES.md`
- `modules/COURTS.md`
- `modules/LOBBIES.md`
- `OBSERVABILITY.md` only if operational metrics are involved

### Admin moderation
Read:
- `AUTH_AND_SECURITY.md`
- `BUSINESS_RULES.md`
- `modules/ADMIN.md`
- `modules/REVIEWS_REPORTS.md`

## Change discipline

When behavior changes:

1. Update the canonical document.
2. Update affected module acceptance criteria.
3. Add/update tests.
4. Add an ADR if the architecture changed materially.
