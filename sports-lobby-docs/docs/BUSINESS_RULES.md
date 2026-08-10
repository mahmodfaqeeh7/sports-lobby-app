# Business Rules

## 1. Vendor publishing eligibility

A vendor may create draft data before approval, but cannot publicly publish active lobbies until vendor verification status is `APPROVED` and the venue/court is active.

If a vendor becomes `SUSPENDED`, new public publishing is blocked. Existing lobbies must follow an explicit admin/system policy rather than being silently deleted.

## 2. Lobby capacity

Every lobby has:
- `minPlayers`
- `maxPlayers`

Backend invariant:
- Active reserved seats must never exceed `maxPlayers`.

A reservation join is successful only after the backend transaction commits.

## 3. Lobby confirmation when underfilled

Each lobby may have a configurable confirmation deadline.

If `reservedPlayers < minPlayers` at the deadline, supported policy actions are:
- cancel automatically;
- allow vendor to confirm/continue;
- allow vendor/admin to extend the deadline.

Initial product recommendation:
- Notify the vendor before the deadline.
- If the vendor does nothing, cancel according to platform policy.
- Fully refund qualifying online payments.
- Do not penalize players.
- Immediately recommend alternatives ranked by same sport, nearby location, similar time, available seats, and reasonable price proximity.

## 4. Pricing

Supported models:

### TOTAL_COURT_PRICE
Vendor sets total court/session price.

The exact rule for distributing total cost across seats must be deterministic and visible before reservation. Do not silently change an already reserved player's committed price because more/fewer people join unless the product explicitly introduces dynamic settlement later.

Recommended initial behavior:
- Calculate and snapshot the player's seat price at reservation from a configured capacity/pricing rule.
- Show the final committed amount before join.

### PRICE_PER_PLAYER
Vendor directly sets seat price.

Every reservation stores price/currency snapshots.

## 5. Cancellation by player

Default initial cancellation window: 12 hours before lobby start.

This value is configurable, not hardcoded globally.

Before the deadline:
- User may cancel according to refund/payment policy.
- Seat returns to availability.

Inside the restricted window:
- Free cancellation may be blocked or allowed with penalty according to configured policy.
- A no-show/late cancellation can generate a strike, balance due, or temporary restriction.

Exceptions must be possible for admin-approved/support cases.

## 6. No-show policy

Use progressive enforcement rather than a permanent ban after one incident.

Potential progression:
1. Warning.
2. Strike.
3. Temporary reservation restriction.
4. Longer restriction / deposit requirement.
5. Admin review.

Signals:
- no-show count/rate;
- late cancellations;
- unpaid balances;
- confirmed abuse reports;
- recency and severity.

Vendor attendance reports should be challengeable through a dispute process before severe penalties are permanent.

## 7. Vendor cancellation

Vendor cancellations are tracked separately from player cancellations.

When a vendor cancels:
- Notify all affected players immediately.
- Refund qualifying online payments.
- Do not penalize players.
- Suggest alternative lobbies.
- Record vendor cancellation metrics.

Late/repeated vendor cancellations may lead to:
- warning;
- vendor strike;
- temporary publishing restriction;
- suspension/admin review.

Vendor UI must display a strong warning before a late cancellation if policy consequences may apply.

## 8. Platform/system cancellation

When cancelled by platform/system for reasons such as underfilled lobby or operational failure:
- no player penalty;
- qualifying online refund;
- clear reason;
- alternatives offered.

## 9. Reservation eligibility

A player cannot reserve when:
- account is suspended;
- a relevant reservation restriction is active;
- required verified phone status is missing;
- outstanding balance policy blocks new reservations;
- lobby is not joinable;
- lobby is full;
- lobby start/deadline policy disallows join;
- player already has an active reservation for that lobby.

Future checks may include age/gender/skill policy if those lobby restrictions are enabled.

## 10. Attendance

Vendor may mark player attendance after/around a completed lobby.

Important constraints:
- Cannot mark attendance for unrelated users.
- Cannot mark attendance for a reservation not belonging to that vendor's lobby.
- Changes after a finalization period require elevated/admin handling.

## 11. Refunds

Full refund normally required for paid online reservations when cancellation is caused by:
- vendor;
- platform/system;
- underfilled-lobby policy.

Player-initiated refund amount depends on cancellation timing/policy.

Refund operations must be idempotent.

## 12. Alternative recommendations after cancellation

Rank alternatives using a deterministic score initially, no ML required.

Candidate requirements:
- same sport preferred;
- start time near original;
- geographically near original/user;
- enough available seats;
- active/verified venue;
- not already conflicted with user's confirmed reservations.

Boosts may include:
- similar price;
- favorite venue;
- high venue rating;
- preferred city/area.

## 13. Reviews

Initial recommendation: allow venue review only after a completed/eligible reservation.

Player-to-player public ratings are deferred because of moderation/social risks. Internal attendance/reliability metrics can exist without being publicly exposed.

## 14. Waitlist

Waitlist is recommended future scope.

When implemented:
- preserve ordered position;
- offer released seat to first eligible user;
- use configurable acceptance window;
- move to next user on decline/timeout;
- never overbook during promotion.

## 15. Configuration

The following should be centrally configurable where practical:
- player cancellation window;
- lobby confirmation deadline lead time;
- reminder offsets;
- strike thresholds;
- restriction durations;
- vendor late-cancellation threshold;
- OTP expiry/attempt limits;
- supported currencies/countries;
- file limits;
- selected platform fees when monetization is introduced.
