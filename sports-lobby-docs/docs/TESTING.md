# Testing Strategy

## 1. Testing pyramid

Use:
- unit tests for domain/business rules;
- integration tests for database transactions/repositories/security;
- API tests for contracts/authorization;
- mobile component/integration tests for critical flows;
- a smaller set of end-to-end happy-path tests.

## 2. Critical backend tests

### Reservation concurrency
Mandatory test:
- lobby has one seat left;
- run multiple concurrent reservation attempts;
- exactly one succeeds;
- capacity never exceeds max;
- failed clients receive deterministic conflict response.

### Cancellation
Test:
- before cancellation window;
- inside restricted window;
- vendor cancellation;
- system underfilled cancellation;
- seat count release;
- no improper user penalty;
- refund request created where applicable.

### Lobby state
Test legal/illegal transitions.

### Vendor authorization
- unapproved vendor cannot publish;
- vendor A cannot edit vendor B venue/lobby.

### Player authorization
- user cannot cancel another user's reservation;
- restricted user cannot reserve.

### Money
- exact decimal amounts;
- duplicate payment/refund request idempotency;
- webhook duplicate handling;
- provider mismatch/failure.

### OTP/auth
- expiration;
- attempt limit;
- resend throttling;
- refresh rotation/revocation;
- account suspension.

## 3. Database integration tests

Prefer running PostgreSQL-compatible tests (e.g. Testcontainers) for behavior depending on locks, constraints, SQL, transactions, and indexes. Do not trust an in-memory database for reservation locking semantics.

## 4. API contract tests

Validate:
- status codes;
- stable error codes;
- pagination;
- validation;
- authorization;
- response date/money formatting.

## 5. Mobile tests

Critical flows:
- login/signup/OTP;
- discovery filtering;
- lobby detail rendering;
- join success;
- join conflict/full lobby;
- cancellation warning;
- reservation history;
- vendor lobby creation;
- offline/timeout/error UX.

## 6. End-to-end scenarios

Minimum production smoke scenarios:
1. Player signup -> OTP -> browse -> reserve -> cancel before deadline.
2. Vendor signup -> admin approval -> create venue/court/lobby -> publish.
3. Players fill lobby -> confirmation -> completion -> attendance.
4. Vendor cancels paid lobby -> refund workflow -> alternative suggestions.

## 7. Load/performance

Before meaningful launch, load-test:
- lobby discovery;
- lobby detail;
- join spikes shortly before game;
- notification job bursts.

Performance tests should use realistic indexes and PostgreSQL.
