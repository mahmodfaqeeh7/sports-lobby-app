# Codex Prompt - Reservation Concurrency

```text
Implement the lobby seat reservation transaction.

Read:
- AGENTS.md
- docs/ARCHITECTURE.md
- docs/DATABASE.md
- docs/BUSINESS_RULES.md
- docs/STATE_MACHINES.md
- docs/API_DESIGN.md
- docs/modules/LOBBIES.md
- docs/modules/RESERVATIONS.md

Critical invariant:
Active reserved seats must never exceed lobby.maxPlayers.

Scenario that MUST pass:
- maxPlayers = 12
- 11 active seats already reserved
- 5 requests attempt to join concurrently
- exactly one request succeeds
- exactly four fail with a deterministic domain conflict
- database contains exactly 12 active seats after all requests finish

Before coding:
1. compare pessimistic locking vs atomic conditional update vs other PostgreSQL-safe approach in the context of the existing code
2. choose one and explain briefly
3. identify transaction boundary and indexes/constraints

Implement:
- server-side eligibility checks
- duplicate active reservation prevention
- atomic capacity reservation
- price snapshot
- correct error code
- concurrency integration test using real PostgreSQL/Testcontainers
- cancellation seat release exactly once

Do not rely on client state or an in-memory test DB for correctness.
```
