# Module: Notifications

Use canonical event/channel list in `../NOTIFICATIONS.md`.

## Purpose
Deliver timely transactional and engagement messages.

## Requirements
- in-app inbox/history;
- push device registration;
- notification preferences;
- SMS OTP;
- deep link to relevant lobby/reservation/vendor screen.

## Reliability
- retries safe;
- duplicate events deduplicated;
- invalid device tokens deactivated;
- critical notification failures observable.

## Acceptance criteria
A user affected by lobby cancellation receives a clear notification and can navigate to refund/alternatives.
