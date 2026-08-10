# Notifications

## 1. Channels

- Push: primary mobile engagement channel.
- In-app: durable notification center/history.
- SMS: OTP and selected critical events if justified.
- Email: optional for receipts, vendor/admin communications, verification outcomes.

## 2. Events

Player:
- phone OTP;
- reservation confirmed;
- reservation cancelled;
- lobby confirmed;
- lobby full;
- lobby changed materially;
- upcoming match reminders;
- lobby cancelled;
- alternative lobby suggestions;
- payment succeeded/failed;
- refund initiated/completed/failed;
- balance due/restriction warning;
- report/dispute update when appropriate.

Vendor:
- verification approved/rejected;
- lobby nearing confirmation deadline while underfilled;
- lobby full;
- important reservation cancellation;
- late cancellation warning;
- strike/restriction notice;
- operational/admin announcement.

## 3. Notification payload

Payloads should contain safe IDs/deep-link targets, not sensitive documents or excessive personal data.

Example:

```json
{
  "type": "LOBBY_CANCELLED",
  "lobbyId": "...",
  "reservationId": "..."
}
```

## 4. Preferences

Users may configure promotional/non-essential notifications.

Do not allow users to disable required security/transaction messages where product/legal policy requires delivery.

## 5. Reliability

- Persist in-app notification before/while sending push when appropriate.
- Make send jobs retry-safe.
- Deduplicate repeated events.
- Store provider delivery errors at a practical level.

## 6. Reminder defaults

Exact reminder offsets remain configurable. Reasonable initial candidates:
- 24 hours before;
- 2-3 hours before;
- selected last-minute reminder.

Do not hardcode until UX/product confirms.
