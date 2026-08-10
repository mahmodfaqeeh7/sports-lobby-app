# Module: Reservations

## Purpose
Safely reserve a player seat in a lobby and preserve booking/cancellation/attendance history.

## Join flow
1. Authenticate/authorize player.
2. Verify phone/eligibility/restrictions.
3. Load authoritative lobby state.
4. Validate join window/status.
5. Validate not already actively reserved.
6. Transactionally reserve capacity.
7. Snapshot price/currency/policy data needed for history.
8. Create payment obligation/record as needed.
9. Commit.
10. Emit reservation-created event/notification.

## Concurrency requirement
Mandatory: if one seat remains, exactly one of simultaneous contenders succeeds.

Failed contenders receive `409 LOBBY_FULL` or equivalent deterministic domain conflict.

## Cancellation
- User cancellation evaluates configured deadline.
- Before free-cancel deadline, release seat and refund per policy.
- Late cancellation may create penalty/strike/balance due.
- Vendor/system cancellation never applies player penalty.
- Capacity release is transactional with cancellation.

## Attendance
- After game, vendor may record ATTENDED/NO_SHOW/EXCUSED according to policy.
- Severe penalties should support dispute/admin correction.

## History
Player sees:
- upcoming active reservations;
- past/completed;
- cancelled;
- payment/refund state.

Vendor sees reservations only for owned lobbies/venues.

## Acceptance criteria
- no overbooking;
- no duplicate active reservation per player/lobby;
- unauthorized cancellation blocked;
- price snapshot immutable;
- capacity restored exactly once on valid cancellation;
- retry does not duplicate reservation/payment.
