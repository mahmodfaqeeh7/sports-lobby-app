# Coding Standards

## 1. General

- Optimize for readability and maintainability.
- Avoid speculative abstraction.
- Keep functions/classes focused.
- Use domain names from `GLOSSARY.md` consistently.
- Prefer explicit business logic over clever generic frameworks.

## 2. Git

Recommended branches:
- `main` production-ready.
- feature branches such as `feat/lobby-reservation`.

Commit examples:
- `feat(lobbies): add vendor lobby creation`
- `fix(reservations): prevent final-seat overbooking`
- `docs(payments): clarify refund lifecycle`

Keep unrelated formatting/refactors out of feature commits when possible.

## 3. Backend Java/Spring

- Modern supported Java version selected by project bootstrap.
- Constructor injection.
- DTOs at API boundary.
- Bean validation plus domain validation.
- Transactions at application service boundaries.
- Avoid business logic in JPA entities if it creates persistence surprises; simple invariant methods are fine.
- Avoid exposing lazy JPA graphs directly from controllers.
- Database migrations managed by Flyway or Liquibase; choose one and standardize.
- Use `BigDecimal` for money.
- Use `Instant` for UTC instants and `ZoneId`/appropriate types for timezones.

## 4. React Native / TypeScript

- TypeScript strict mode.
- Functional components/hooks.
- Feature-based organization.
- Central API client.
- Central auth/session management.
- Centralized theme/tokens.
- Avoid `any` except narrow, documented integration boundaries.
- Distinguish server cache/state from local presentation state.
- Reusable forms/validation where it reduces duplication.

## 5. Naming

Use business terms consistently:
- Vendor: business/operator.
- Venue: physical location.
- Court: bookable playing surface/field.
- Lobby: scheduled game/session offered to players.
- Reservation: player's claim to a lobby seat.

Do not use `playground`, `field`, `venue`, and `court` interchangeably in code.

## 6. Errors

- Domain errors map to stable API error codes.
- Do not catch-and-ignore exceptions.
- Log unexpected errors with request/correlation context.
- Mobile maps known API errors to useful user messages.

## 7. Configuration

- Environment-specific values via configuration/env/secrets.
- Business-policy settings centralized; no magic numbers scattered across modules.

## 8. Documentation

Public APIs/complex algorithms need useful documentation. Avoid comments that merely repeat code.
