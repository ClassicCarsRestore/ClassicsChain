CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT,
    token TEXT UNIQUE NOT NULL,
    token_expires_at TIMESTAMP NOT NULL,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    invitation_type VARCHAR(20) NOT NULL CHECK (invitation_type IN ('admin', 'entity_member')),
    entity_role VARCHAR(20),
    invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
    claimed_at TIMESTAMP
);

CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_token ON user_invitations(token) WHERE token IS NOT NULL;
CREATE INDEX idx_user_invitations_entity ON user_invitations(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_user_invitations_pending ON user_invitations(email, claimed_at) WHERE claimed_at IS NULL;

---- create above / drop below ----

DROP TABLE IF EXISTS user_invitations;
