# Observability

## 1. Goals

Know when users cannot:
- log in/verify;
- discover lobbies;
- reserve seats;
- pay/refund;
- receive important notifications;
- publish vendor lobbies.

## 2. Structured logging

Include where appropriate:
- timestamp;
- level;
- request/correlation ID;
- user ID (non-sensitive identifier);
- module/action;
- result/error code;
- latency.

Never log passwords, OTP codes, tokens, private docs, or payment secrets.

## 3. Metrics

Technical:
- request rate/error rate/latency;
- DB pool usage;
- job failures;
- external provider latency/error rate;
- push send failure;
- S3 failures.

Business-operational:
- reservation success/conflict rate;
- lobbies published/full/cancelled;
- underfilled cancellation rate;
- payment success/refund failure;
- vendor verification backlog;
- no-show rate.

## 4. Alerts

Examples:
- elevated 5xx rate;
- reservation endpoint conflict/error abnormality;
- DB unavailable/high saturation;
- payment webhook processing failures;
- refund stuck/failed threshold;
- OTP provider failure;
- notification queue/job backlog.

## 5. Error tracking

Use a production error tracking service when deployment begins. Scrub personal/sensitive data before sending context.

## 6. Audit vs logs

Audit logs are product/security history and have controlled retention. Application logs are operational diagnostics. Do not treat them as the same thing.
