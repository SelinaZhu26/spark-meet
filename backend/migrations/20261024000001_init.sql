-- Core Spark schema. Lives in Supabase Postgres.
--
-- Row level security is enabled on every table without policies so that
-- Supabase's auto-generated REST API (anon/authenticated roles) can't read
-- anything. The backend connects as the table owner, which bypasses RLS.

CREATE TABLE profiles (
    -- Supabase auth user id (`sub` claim of the access token).
    id UUID PRIMARY KEY,
    display_name TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    interests TEXT[] NOT NULL DEFAULT '{}',
    friends_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    dating_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    -- The ON/OFF switch. Only active users are matched.
    active BOOLEAN NOT NULL DEFAULT FALSE,
    push_token TEXT,
    -- Gemini embedding of the aggregated interest profile.
    embedding REAL[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Bumped only when match-relevant content changes (profile fields or
    -- linked integrations), so fizzled pairs get a second chance.
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE integrations (
    user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('spotify', 'strava')),
    -- Plain-text interest summary fed into the interest profile.
    summary TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, provider)
);

CREATE TABLE oauth_states (
    state TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    return_to TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- One row per pair of users that have been near each other. The unique
-- (user_a, user_b) constraint is what guarantees a pair is only ever scored
-- once, no matter which phone reports the encounter first.
CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'scoring'
        CHECK (status IN ('scoring', 'sparked', 'fizzled', 'failed')),
    similarity REAL,
    score SMALLINT,
    mode TEXT CHECK (mode IN ('friends', 'dating')),
    shared_interests TEXT[] NOT NULL DEFAULT '{}',
    reason TEXT,
    icebreaker TEXT,
    a_waved_at TIMESTAMPTZ,
    b_waved_at TIMESTAMPTZ,
    a_notified_at TIMESTAMPTZ,
    b_notified_at TIMESTAMPTZ,
    sparked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_a, user_b),
    CHECK (user_a < user_b)
);

CREATE INDEX encounters_user_b_idx ON encounters (user_b);

CREATE TABLE messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    encounter_id UUID NOT NULL REFERENCES encounters (id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX messages_encounter_idx ON messages (encounter_id, id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
