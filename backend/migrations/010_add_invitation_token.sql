-- Add token column to vehicle_invitations for secure invitation links
ALTER TABLE vehicle_invitations ADD COLUMN token TEXT UNIQUE;
ALTER TABLE vehicle_invitations ADD COLUMN token_expires_at TIMESTAMP;

-- Create index for token lookups
CREATE INDEX idx_invitations_token ON vehicle_invitations(token) WHERE token IS NOT NULL;
