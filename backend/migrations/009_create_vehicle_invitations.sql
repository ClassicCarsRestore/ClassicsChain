-- Create table for tracking vehicle invitations
CREATE TABLE vehicle_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
    claimed_at TIMESTAMP
);

CREATE INDEX idx_invitations_email ON vehicle_invitations(email);
CREATE INDEX idx_invitations_vehicle ON vehicle_invitations(vehicle_id);