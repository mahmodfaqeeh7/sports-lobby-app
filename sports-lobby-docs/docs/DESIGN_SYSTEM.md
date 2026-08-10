# Design System Direction

## 1. Brand direction

The UI should feel:
- modern;
- smooth;
- energetic/sports-oriented;
- trustworthy;
- clean;
- friendly.

Initial visual direction:
- green-based palette;
- rounded edges;
- generous modern spacing;
- clear cards;
- strong availability/status visibility;
- smooth but restrained animation.

Exact color tokens will be supplied later.

## 2. Tokenize, do not hardcode

Central tokens:
- colors;
- spacing;
- typography;
- radii;
- shadows/elevation;
- icon sizes;
- animation durations;
- breakpoints where applicable.

Do not put random hex values and spacing numbers throughout screens.

## 3. Core reusable components

Recommended:
- Button variants
- TextField / PasswordField / PhoneField
- OTP input
- Search bar
- Filter chips
- Bottom sheet/modal
- Sport chip/icon
- Venue card
- Lobby card
- Price display
- Seat availability indicator
- Status badge
- Empty state
- Error state
- Skeleton/loading state
- Avatar
- Image gallery
- Map preview
- Confirmation dialog
- Snackbar/toast
- Date/time selector
- Currency amount

## 4. Lobby card priorities

A lobby card should make these immediately scannable:
- sport;
- venue;
- distance/city;
- date/time;
- price per player/booking pricing display;
- joined/max players or seats left;
- status;
- relevant skill/restriction labels.

## 5. Accessibility

- Reasonable text contrast.
- Touch targets sized for mobile.
- Do not communicate status using color only.
- Support dynamic text where practical.
- Accessible labels for icon-only controls.

## 6. UX for reservation

Joining must clearly show:
- final price owed now/later;
- cancellation rule/deadline;
- venue/time;
- seat count;
- payment method.

After tapping Join, prevent accidental duplicate UI submission but rely on backend for correctness.

## 7. UX for failure/cancellation

When a lobby is cancelled:
- explain why;
- show refund state if relevant;
- show recommended alternatives immediately;
- preserve user trust with clear next steps.

## 8. Vendor UX

Vendor app/surface should feel operational, not like a consumer profile with extra buttons.

Prioritize:
- today's schedule;
- occupancy;
- upcoming lobbies;
- quick create/copy lobby;
- attendance;
- revenue/booking summaries;
- warnings requiring action.
