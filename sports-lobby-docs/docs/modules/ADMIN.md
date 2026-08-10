# Module: Admin

## Purpose
Provide trusted marketplace operations, verification, moderation, analytics, and configuration.

## Capabilities
- user search/view/restrict/suspend;
- vendor verification queue;
- vendor approve/reject/suspend;
- venue/lobby/reservation inspection;
- sports management;
- report/dispute management;
- payment/refund inspection/manual actions under strict permission;
- platform configuration;
- audit log view;
- dashboard metrics.

## Dashboard metrics
Examples:
- total/new/active users;
- vendors pending/approved;
- active venues;
- lobbies/reservations/completed games;
- cancellation/no-show rates;
- booking value/revenue when available;
- popular sports/cities;
- occupancy/utilization;
- report backlog;
- refund failures.

## Security
- admin endpoints separated/protected;
- important actions audited;
- least privilege for future admin permission levels;
- no silent destructive changes.

## Acceptance criteria
Every vendor verification decision includes reviewer and reason/history. Every restriction/manual financial action is auditable.
