DROP TABLE IF EXISTS pickups CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('PROVIDER', 'NGO', 'VOLUNTEER', 'ADMIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6)
);

CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES users(id),
    food_name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
    location_id INTEGER NOT NULL REFERENCES locations(id),
    prepared_at TIMESTAMPTZ NOT NULL,
    expiry_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'PARTIALLY_CLAIMED', 'CLAIMED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (expiry_at > prepared_at)
);

CREATE TABLE claims (
    id SERIAL PRIMARY KEY,
    donation_id INTEGER NOT NULL REFERENCES donations(id),
    ngo_id INTEGER NOT NULL REFERENCES users(id),
    quantity_claimed INTEGER NOT NULL CHECK (quantity_claimed > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'CLAIMED'
        CHECK (status IN ('CLAIMED', 'PICKUP_PENDING', 'PICKED_UP', 'CANCELLED')),
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pickups (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER UNIQUE NOT NULL REFERENCES claims(id),
    volunteer_id INTEGER REFERENCES users(id),
    pickup_time TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_status_expiry
ON donations(status, expiry_at);

CREATE INDEX idx_donations_provider
ON donations(provider_id);

CREATE INDEX idx_claims_ngo
ON claims(ngo_id);

CREATE INDEX idx_claims_donation
ON claims(donation_id);
