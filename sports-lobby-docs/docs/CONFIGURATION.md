# Platform Configuration

Business policy must be centrally configurable where change is expected. Configuration is not a replacement for versioned product decisions; it is for approved tunable values.

## Recommended configurable keys

### Reservations
- default player cancellation window (initially 12 hours)
- join cutoff before start
- maximum active future reservations per player if introduced
- outstanding-balance threshold that blocks new reservations

### Lobbies
- default confirmation deadline lead time
- default underfilled action
- vendor response/extension window
- minimum/maximum sensible capacity limits

### Penalties
- no-show strike weights
- late-cancellation strike weights
- warning/restriction thresholds
- restriction durations
- vendor late-cancellation threshold and consequences

### Notifications
- reminder offsets
- resend/retry limits
- promotional defaults

### Authentication
- OTP expiry
- OTP resend cooldown
- OTP maximum attempts
- password-reset expiry

### Files
- max image/document sizes
- allowed MIME types
- signed URL expiry

### Geography/commerce
- enabled countries
- enabled currencies
- enabled payment methods/providers

## Rules

- Values must have safe defaults and validation ranges.
- Sensitive secrets are not stored in `system_settings`; use a secret manager/environment configuration.
- Important policy changes are audited with actor and timestamp.
- A setting change must not silently rewrite historical reservation/payment obligations. Snapshot policy values when historical interpretation requires it.
- Mobile should not own policy constants that control server authorization or penalties.
