# Module: Lobbies

## Purpose
A lobby is the central marketplace offering: a scheduled sports game/session with joinable player seats.

## Actors
- Vendor creates/manages.
- Player discovers/views.
- System changes state at deadlines.
- Admin may intervene.

## Required fields
- venue/court/sport;
- start/end;
- min/max players;
- pricing model;
- price/currency;
- confirmation deadline;
- cancellation deadline/policy snapshot where needed;
- optional description, skill, age, gender restrictions.

## Status
See `../STATE_MACHINES.md`.

## Create/publish
- Draft may be saved incomplete within allowed validation.
- Publish requires complete valid data.
- Vendor must be approved.
- Venue/court active and owned by vendor.
- Court supports sport.
- Schedule must not conflict with another active lobby on same court.

## Discovery
Only player-visible statuses should appear in discovery.

Filters:
- sport;
- city/area;
- distance;
- date/time;
- price;
- available seats;
- optional future skill/rating.

## Underfilled behavior
At confirmation deadline evaluate `reserved >= minPlayers`.

If not enough:
- follow configured continue/extend/cancel policy;
- if cancelled, trigger refunds without player penalties;
- notify users;
- produce alternative recommendations.

## Vendor cancellation
- require reason;
- warn on late cancellation;
- record policy impact;
- notify/refund/recommend alternatives.

## Acceptance criteria
- Invalid state transitions rejected.
- Unapproved vendor cannot publish.
- Overlapping court scheduling rejected.
- Historical lobby data remains readable after venue/sport changes.
