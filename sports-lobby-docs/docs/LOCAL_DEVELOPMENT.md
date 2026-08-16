# Local Development

This is the active environment for day-to-day work. Local development uses a
local PostgreSQL container, local object storage, test OTP `999999`, and HTTP
between the simulator and backend. None of these development shortcuts may be
used in production.

## Environment files

Environment files are intentionally not committed. Create them once on each
development machine:

```bash
cp backend/.env.local.example backend/.env.local
cp mobile/.env.local.example mobile/.env.local
```

The checked-in `*.example` files define the supported keys. Do not add secrets
to a mobile environment file because values are bundled into the application.

## Start the backend

```bash
cd backend
docker compose up -d postgres
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The `local` profile is also the backend default, so plain
`mvn spring-boot:run` remains valid. Spring Boot runs Flyway migrations during
startup. Verify the backend at `http://localhost:8080/actuator/health`.

Local backend behavior:

- PostgreSQL: `localhost:5432/sports_lobby`;
- API: `http://localhost:8080/api/v1`;
- KYC object storage: `backend/.local-object-storage`;
- local demo data and court media: enabled by default for the `local` profile;
- SMS delivery: disabled;
- OTP: `999999` is accepted only after the API successfully creates a current
  OTP challenge;
- authentication rate limiting: enabled.

Set `SPORTS_LOBBY_DEMO_DATA_ENABLED=false` in `backend/.env.local` when an empty manual-development dataset is needed. Demo data is never enabled by the production profile.

### Demo accounts

| Account | Phone | Password | Purpose |
|---|---|---|---|
| Player | `+962790000001` | `Demo123!` | Explore seeded lobbies and view a seeded booking |
| Approved vendor | `+962790000002` | `Demo123!` | Manage seeded venues, courts, images, and lobbies |
| Pending vendor | `+962790000003` | `Demo123!` | Inspect pending KYC state |
| Admin | `+962799999999` | `Admin123!` | Review the pending demo vendor |

The initializer is idempotent and reuses an existing account with the same demo phone/email. It refreshes the fixed demo lobbies into the future on backend startup while leaving non-demo records alone.

## Start the mobile app

Install dependencies once:

```bash
cd mobile
npm install
cd ios && bundle exec pod install && cd ..
```

Start Metro in one terminal:

```bash
cd mobile
npm run start:local
```

Start a simulator build in another terminal:

```bash
npm run ios:local
# or
npm run android:local
```

With an empty local `API_BASE_URL`, iOS Simulator uses
`http://localhost:8080/api/v1` and Android Emulator uses
`http://10.0.2.2:8080/api/v1`. For a physical phone, set `API_BASE_URL` in
`mobile/.env.local` to the computer's reachable LAN address, including
`/api/v1`, then rebuild the native app.

## Role access

| Account role | Mobile areas | Backend capability |
|---|---|---|
| `PLAYER` | Explore, Bookings, Profile | Discover, join, and cancel own reservations |
| `VENDOR` | Vendor, Profile | Manage own KYC, venues, courts, and lobby drafts |
| approved `VENDOR` | Vendor, Profile | Also publish owned lobbies |
| `ADMIN` | Admin, Profile | Review and approve/reject vendors |

An account with multiple roles receives the combined areas. Phone verification
is required before a player can reserve and is part of player/vendor signup.

## Local verification

```bash
cd backend && mvn test
cd ../mobile && npm run typecheck && npm test -- --runInBand && npm run lint
```

PostgreSQL data persists in the Docker volume. It does not travel through Git.
Use a database dump/restore when moving test data between computers.
