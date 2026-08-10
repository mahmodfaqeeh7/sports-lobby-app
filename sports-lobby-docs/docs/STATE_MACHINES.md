# State Machines

Statuses must have explicit legal transitions. Controllers/clients must not assign arbitrary target states.

## 1. Lobby lifecycle

Core statuses:

`DRAFT -> OPEN -> FULL -> CONFIRMED -> IN_PROGRESS -> COMPLETED`

Additional terminal/side statuses:
- `CANCELLED`
- `EXPIRED`

### Recommended legal transitions

- DRAFT -> OPEN: verified vendor publishes valid lobby.
- DRAFT -> CANCELLED: vendor discards/cancels draft.
- OPEN -> FULL: last available seat is reserved.
- OPEN -> CONFIRMED: minimum conditions satisfied and confirmation occurs before full capacity.
- OPEN -> CANCELLED: vendor/admin/system cancellation.
- OPEN -> EXPIRED: start/confirmation deadline passes under expiration policy.
- FULL -> OPEN: a reservation is cancelled and seat reopens, only before confirmation rules prohibit it.
- FULL -> CONFIRMED: confirmation conditions met.
- FULL -> CANCELLED: vendor/admin/system cancellation.
- CONFIRMED -> IN_PROGRESS: start threshold/time reached or vendor starts session according to policy.
- CONFIRMED -> CANCELLED: exceptional/late cancellation with policy consequences.
- IN_PROGRESS -> COMPLETED: game ends/finalized.
- IN_PROGRESS -> CANCELLED: only exceptional admin/operational case; preserve audit reason.

`COMPLETED`, `CANCELLED`, and `EXPIRED` are normally terminal.

### Notes

`FULL` describes capacity, while `CONFIRMED` describes commitment to run. Depending on final implementation, capacity can also be derived rather than treated as a durable lifecycle state. If the team decides `FULL` should be a computed condition rather than persisted state, record that as an ADR and update this document.

## 2. Reservation lifecycle

Recommended statuses:
- `RESERVED`
- `CONFIRMED`
- `CANCELLED`
- `COMPLETED`

Attendance is preferably separate:
- UNKNOWN
- ATTENDED
- NO_SHOW
- EXCUSED

Refund is a payment/refund state, not a reservation state.

Possible transitions:
- none -> RESERVED after successful seat transaction.
- RESERVED -> CONFIRMED when lobby becomes confirmed / payment requirements satisfied as defined.
- RESERVED/CONFIRMED -> CANCELLED on valid cancellation.
- CONFIRMED -> COMPLETED after lobby completion.

## 3. Payment lifecycle

Statuses:
- `UNPAID`
- `PENDING`
- `PAID`
- `REFUNDED`
- `FAILED`
- `CANCELLED`
- `BALANCE_DUE`

Notes:
- `UNPAID` is useful for cash/payment-at-venue obligations.
- `PENDING` represents provider processing/authorization.
- `PAID` only after trusted provider confirmation or controlled cash settlement.
- `REFUNDED` only after successful refund finalization; partial refund may require a richer amount-based model later.
- `BALANCE_DUE` is an obligation state and may be modeled separately from payment attempts in a refined design. If implemented, keep semantics explicit.

## 4. Refund lifecycle

Recommended:
- REQUESTED
- PENDING
- COMPLETED
- FAILED
- CANCELLED

Retry must be idempotent.

## 5. Vendor verification

- `PENDING`
- `APPROVED`
- `REJECTED`
- `SUSPENDED`

Transitions:
- submission -> PENDING
- PENDING -> APPROVED
- PENDING -> REJECTED
- REJECTED -> PENDING via new/resubmitted application, preserving history
- APPROVED -> SUSPENDED
- SUSPENDED -> APPROVED after admin review/reactivation if allowed

## 6. Report/moderation case

Recommended:
- OPEN
- UNDER_REVIEW
- ACTION_TAKEN
- DISMISSED
- CLOSED

## 7. Restriction

Recommended:
- SCHEDULED/ACTIVE/EXPIRED/REVOKED or derive status from dates plus revocation.

Prefer dates and audit history over destructive status rewriting.
