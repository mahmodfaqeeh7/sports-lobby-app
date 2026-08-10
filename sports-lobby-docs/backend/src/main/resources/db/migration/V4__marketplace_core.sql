CREATE TABLE sports (
    id UUID PRIMARY KEY,
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sports (id, code, name)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'FOOTBALL', 'Football'),
    ('10000000-0000-0000-0000-000000000002', 'BASKETBALL', 'Basketball'),
    ('10000000-0000-0000-0000-000000000003', 'VOLLEYBALL', 'Volleyball'),
    ('10000000-0000-0000-0000-000000000004', 'TENNIS', 'Tennis'),
    ('10000000-0000-0000-0000-000000000005', 'PADEL', 'Padel'),
    ('10000000-0000-0000-0000-000000000006', 'BADMINTON', 'Badminton');

CREATE TABLE venues (
    id UUID PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    name VARCHAR(180) NOT NULL,
    description VARCHAR(1000),
    country_code CHAR(2) NOT NULL,
    city VARCHAR(120) NOT NULL,
    area VARCHAR(120),
    address_line VARCHAR(255) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    timezone VARCHAR(80) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT venues_status_check CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED')),
    CONSTRAINT venues_contact_phone_check CHECK (contact_phone ~ '^\+[1-9][0-9]{7,14}$'),
    CONSTRAINT venues_latitude_check CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT venues_longitude_check CHECK (longitude >= -180 AND longitude <= 180)
);

CREATE INDEX venues_vendor_status_idx ON venues (vendor_id, status);
CREATE INDEX venues_city_status_idx ON venues (city, status);

CREATE TABLE courts (
    id UUID PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(1000),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    default_min_players INTEGER,
    default_max_players INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT courts_status_check CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT courts_capacity_check CHECK (
        (default_min_players IS NULL AND default_max_players IS NULL)
        OR (default_min_players > 0 AND default_max_players >= default_min_players)
    )
);

CREATE INDEX courts_venue_status_idx ON courts (venue_id, status);

CREATE TABLE court_sports (
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (court_id, sport_id)
);

CREATE TABLE lobbies (
    id UUID PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE RESTRICT,
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    venue_timezone_snapshot VARCHAR(80) NOT NULL,
    min_players INTEGER NOT NULL,
    max_players INTEGER NOT NULL,
    reserved_seat_count INTEGER NOT NULL DEFAULT 0,
    pricing_model VARCHAR(40) NOT NULL,
    currency_code CHAR(3) NOT NULL,
    total_court_price NUMERIC(12, 2),
    price_per_seat NUMERIC(12, 2),
    description VARCHAR(1000),
    cancellation_deadline_at TIMESTAMPTZ NOT NULL,
    confirmation_deadline_at TIMESTAMPTZ NOT NULL,
    published_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason_code VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lobbies_status_check CHECK (status IN ('DRAFT', 'OPEN', 'FULL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT lobbies_capacity_check CHECK (min_players > 0 AND max_players >= min_players AND reserved_seat_count >= 0 AND reserved_seat_count <= max_players),
    CONSTRAINT lobbies_time_check CHECK (ends_at > starts_at AND cancellation_deadline_at <= starts_at AND confirmation_deadline_at <= starts_at),
    CONSTRAINT lobbies_pricing_model_check CHECK (pricing_model IN ('TOTAL_COURT_PRICE', 'PRICE_PER_PLAYER')),
    CONSTRAINT lobbies_price_check CHECK (
        (pricing_model = 'TOTAL_COURT_PRICE' AND total_court_price IS NOT NULL AND total_court_price >= 0 AND price_per_seat IS NOT NULL AND price_per_seat >= 0)
        OR (pricing_model = 'PRICE_PER_PLAYER' AND price_per_seat IS NOT NULL AND price_per_seat >= 0)
    )
);

CREATE INDEX lobbies_vendor_status_idx ON lobbies (vendor_id, status);
CREATE INDEX lobbies_discovery_idx ON lobbies (status, starts_at, sport_id);
CREATE INDEX lobbies_court_time_idx ON lobbies (court_id, starts_at, ends_at)
    WHERE status IN ('OPEN', 'FULL', 'CONFIRMED', 'IN_PROGRESS');

CREATE TABLE reservations (
    id UUID PRIMARY KEY,
    lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL,
    seat_count INTEGER NOT NULL DEFAULT 1,
    unit_price_snapshot NUMERIC(12, 2) NOT NULL,
    currency_code_snapshot CHAR(3) NOT NULL,
    reserved_at TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    cancellation_actor VARCHAR(30),
    cancellation_reason_code VARCHAR(80),
    attendance_status VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reservations_status_check CHECK (status IN ('RESERVED', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    CONSTRAINT reservations_attendance_status_check CHECK (attendance_status IN ('UNKNOWN', 'ATTENDED', 'NO_SHOW', 'EXCUSED')),
    CONSTRAINT reservations_seat_count_check CHECK (seat_count = 1),
    CONSTRAINT reservations_cancel_check CHECK (
        status <> 'CANCELLED' OR (cancelled_at IS NOT NULL AND cancellation_actor IS NOT NULL)
    )
);

CREATE UNIQUE INDEX reservations_one_active_per_user_lobby_idx
    ON reservations (lobby_id, user_id)
    WHERE status IN ('RESERVED', 'CONFIRMED');

CREATE INDEX reservations_user_status_idx ON reservations (user_id, status, reserved_at DESC);
CREATE INDEX reservations_lobby_status_idx ON reservations (lobby_id, status);
