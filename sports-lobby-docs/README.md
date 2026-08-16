# Sports Lobby Marketplace

> Working project name. Replace this title when the product name is finalized.

A mobile marketplace that connects sports venues with individual players through scheduled **lobbies**. A venue publishes an available court/field time; players reserve individual seats without needing to organize a full group themselves.

Initial market: **Jordan**. The design must support later expansion to other countries, currencies, languages, sports, and time zones.

## Core product loop

1. A verified vendor creates a venue and courts/fields.
2. The vendor publishes a lobby for a sport, date/time, capacity, and price.
3. Players discover the lobby using sport, city, map, distance, date, price, and availability filters.
4. Players reserve individual seats.
5. The platform prevents overbooking with server-side transactional concurrency control.
6. The lobby becomes full/confirmed or is cancelled/expired according to configurable rules.
7. Players receive reminders, play the match, and attendance is recorded.
8. History, statistics, payments/refunds, reviews, reports, and vendor analytics are retained.

## Technology direction

- Mobile: React Native + TypeScript
- Backend: Spring Boot
- Database: PostgreSQL
- Object storage: AWS S3
- API: REST initially
- Architecture: modular monolith
- Auth: phone verification + password, Google sign-in, secure access/refresh tokens
- Maps: provider abstraction; exact venue coordinates plus country/city/area
- Notifications: push + in-app; SMS/email where appropriate
- Payments: cash initially supported; online payment architecture provider-agnostic

## Documentation map

Start here:

- `AGENTS.md` - rules for Codex and other coding agents.
- `docs/INDEX.md` - documentation ownership and reading order.
- `docs/PRODUCT_REQUIREMENTS.md` - product scope, personas, flows, acceptance principles.
- `docs/ARCHITECTURE.md` - system architecture and module boundaries.
- `docs/DATABASE.md` - canonical logical data model.
- `docs/BUSINESS_RULES.md` - cancellation, penalties, refunds, vendor verification behavior.
- `docs/CONFIGURATION.md` - centrally tunable policy/configuration values.
- `docs/STATE_MACHINES.md` - lobby/reservation/payment/vendor states and legal transitions.
- `docs/API_DESIGN.md` - API conventions and endpoint patterns.
- `docs/AUTH_AND_SECURITY.md` - authentication, authorization and security requirements.
- `docs/modules/` - detailed module specifications.
- `prompts/` - prompt templates for Codex implementation tasks.

## Recommended repository layout

```text
sports-lobby-app/
├── AGENTS.md
├── README.md
├── docs/
│   ├── INDEX.md
│   ├── PRODUCT_REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API_DESIGN.md
│   ├── AUTH_AND_SECURITY.md
│   ├── BUSINESS_RULES.md
│   ├── CONFIGURATION.md
│   ├── STATE_MACHINES.md
│   ├── DESIGN_SYSTEM.md
│   ├── NOTIFICATIONS.md
│   ├── PAYMENTS.md
│   ├── CODING_STANDARDS.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   ├── OBSERVABILITY.md
│   ├── ROADMAP.md
│   ├── GLOSSARY.md
│   ├── OPEN_QUESTIONS.md
│   ├── adr/
│   └── modules/
├── prompts/
├── mobile/
└── backend/
```

## Development principle

The documentation is the project source of truth. Do not ask an AI agent to implement a large area from memory. For each task, point it to `AGENTS.md`, the relevant architecture/data/business documents, and exactly one or a few module files.

Prefer small vertical slices that can be verified end-to-end over generating the whole application at once.

## Bootstrap Foundation

This repository now contains the initial project foundation only. Product modules should be implemented in small documented slices.

### Structure

```text
backend/
  pom.xml
  docker-compose.yml
  src/main/java/com/sportslobby/
    auth/           # auth module boundary
    common/         # API errors, request IDs, shared web infrastructure
    health/         # health endpoint
    integrations/   # external provider adapter boundary
    security/       # API security defaults
    users/          # identity/account boundary
  src/main/resources/
    application.yml
    db/migration/

mobile/
  App.tsx
  src/
    app/
    components/
    features/
    services/
    store/
    theme/
    types/
    utils/
```

### Dependency Choices

Backend:
- Spring Boot 3.5.x with Java 17 for a conservative supported baseline.
- `spring-boot-starter-web` for REST APIs.
- `spring-boot-starter-validation` for server-side request validation.
- `spring-boot-starter-security` for deny-by-default API security foundations.
- `spring-boot-starter-actuator` for operational health endpoints.
- Flyway with PostgreSQL support for versioned database migrations.
- PostgreSQL JDBC driver for the transactional database.
- Spring Boot test, Spring Security test, and Testcontainers for future API/security/database tests.

Mobile:
- React Native 0.86.x and React 19.1.x for the current stable React Native line.
- TypeScript in strict mode through the React Native TypeScript config.
- React Native ESLint, Prettier, Jest, and React Test Renderer for linting, formatting, type checking, and test infrastructure.

### Backend Setup

Prerequisites:
- Java 17+
- Maven 3.6.3+ or a project Maven wrapper
- Docker for local PostgreSQL

Start PostgreSQL:

```bash
cd backend
docker compose up -d postgres
```

Run the backend:

```bash
cd backend
mvn spring-boot:run
```

Run tests:

```bash
cd backend
mvn test
```

Run Flyway migrations against local PostgreSQL:

```bash
cd backend
mvn flyway:migrate
```

The default development values are documented in `backend/.env.local.example` and `backend/docker-compose.yml`. Copy the template to the ignored `backend/.env.local`; do not commit real secrets.

Health endpoints:
- `GET /api/v1/health`
- `GET /actuator/health`

### Mobile Setup

Prerequisites:
- Node.js 22+
- npm 11+
- iOS/Android native toolchains when running on device or simulator

Install dependencies:

```bash
cd mobile
npm install
```

Run checks:

```bash
cd mobile
npm run typecheck
npm run lint
npm test
```

Start Metro:

```bash
cd mobile
npm start
```

The mobile foundation includes the React Native TypeScript shell, fresh React Native 0.86 native iOS/Android projects, Metro/Jest/ESLint/TypeScript configuration, centralized theme/API/session boundaries, and tests.

Run the app with:

```bash
cd mobile
npm run ios
npm run android
```
