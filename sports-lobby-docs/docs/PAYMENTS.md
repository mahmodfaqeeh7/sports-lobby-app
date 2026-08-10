# Payments and Money Model

## 1. Scope

Initial product supports cash/payment-at-venue and is architected for online card/Apple Pay later.

Money design must not require a data-model rewrite when online payments are added.

## 2. Core principles

- Reservation state != payment state.
- Store money as exact decimal + ISO currency code.
- Snapshot committed reservation price.
- Never trust client-calculated totals.
- Provider integrations live behind `PaymentGateway`.
- Provider webhooks are verified and idempotent.
- Refunds are first-class records, not just a flag.

## 3. Payment statuses

- UNPAID
- PENDING
- PAID
- REFUNDED
- FAILED
- CANCELLED
- BALANCE_DUE

`BALANCE_DUE` may later evolve into a separate receivable/ledger obligation model; do not overload a provider payment attempt with ambiguous semantics.

## 4. Cash flow

For cash/pay-at-venue:
- reservation records the amount owed;
- payment may remain UNPAID until vendor records settlement or the product treats attendance as settlement under an agreed rule;
- manual settlement actions are auditable.

## 5. Online flow (future-ready)

Typical sequence:
1. Backend calculates authoritative amount.
2. Backend creates provider payment intent with idempotency key.
3. Client completes provider SDK flow.
4. Backend verifies status via trusted provider webhook/API.
5. Payment becomes PAID.
6. Reservation confirmation proceeds according to business policy.

## 6. Refunds

Full refund normally for:
- vendor cancellation;
- platform/system cancellation;
- underfilled lobby cancellation.

User cancellation refund depends on cancellation window/policy.

Refund operation:
- create refund record;
- submit idempotently;
- remain PENDING while provider processes;
- finalize COMPLETED/FAILED based on trusted provider state;
- notify user.

## 7. Penalties / outstanding balances

Do not represent all accounting by mutating `users.balance`.

Use ledger/obligation records so every adjustment has:
- amount;
- currency;
- reason;
- source reservation/lobby;
- timestamp;
- actor/system origin.

A cached balance can be derived from ledger entries.

## 8. Monetization readiness

Platform business model is intentionally unresolved.

Architecture should allow future:
- commission per booking;
- online payment fee;
- vendor subscription;
- featured placement;
- promotions/credits.

Do not implement platform fees until product rules are approved, but avoid schemas that assume gross payment always equals vendor revenue.

## 9. Reconciliation

When online payments launch, add reconciliation jobs/dashboards to detect:
- provider paid but local pending;
- local refund pending too long;
- duplicate webhook events;
- amount/currency mismatch.
