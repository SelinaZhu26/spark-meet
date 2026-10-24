-- Location pings. Lives in Tiger Data (TimescaleDB + PostGIS).
--
-- Pings are never returned by the API. They only exist long enough to answer
-- "who is within N meters of me right now" and are dropped after an hour.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE location_pings (
    user_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    location GEOGRAPHY (POINT, 4326) NOT NULL,
    accuracy_m REAL
);

CREATE INDEX location_pings_location_idx ON location_pings USING GIST (location);
CREATE INDEX location_pings_user_idx ON location_pings (user_id, recorded_at DESC);

-- Turn the table into a hypertable with an hourly retention policy when
-- TimescaleDB is available. Without it the backend's prune task still
-- deletes old pings.
DO $$
BEGIN
    BEGIN
        CREATE EXTENSION IF NOT EXISTS timescaledb;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'timescaledb unavailable, location_pings stays a plain table: %', SQLERRM;
        RETURN;
    END;
    PERFORM create_hypertable('location_pings', by_range('recorded_at', INTERVAL '15 minutes'));
    PERFORM add_retention_policy('location_pings', INTERVAL '1 hour');
END
$$;
