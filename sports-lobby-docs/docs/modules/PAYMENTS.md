# Module: Payments

Use canonical rules in `../PAYMENTS.md`.

## Purpose
Track payment obligations, attempts, settlement, refunds, penalties, and future online gateways.

## Initial support
- Cash/pay at venue.
- Payment status visible on reservation/vendor/admin views.

## Future online support
- Card.
- Apple Pay through supported gateway.
- Provider-specific adapters.

## Required behaviors
- backend authoritative amount;
- exact decimal currency;
- idempotent payment/refund requests;
- verified provider webhook processing;
- full qualifying refunds for vendor/system/underfilled cancellation;
- audit manual adjustments.

## Acceptance criteria
- no client can mark itself paid;
- duplicate webhook cannot double-credit/refund;
- refund failure remains visible/retryable;
- financial history preserved.
