-- Push tokens are moved, not copied, when a device signs into another
-- account; this keeps that lookup cheap.
CREATE INDEX profiles_push_token_idx ON profiles (push_token) WHERE push_token IS NOT NULL;
