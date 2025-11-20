-- name: CreateInvitation :one
INSERT INTO vehicle_invitations (vehicle_id, email, token, token_expires_at)
VALUES ($1, $2, $3, $4)
RETURNING id, vehicle_id, email, token, token_expires_at, invited_at, claimed_at;

-- name: GetPendingInvitationsByEmail :many
SELECT id, vehicle_id, email, token, token_expires_at, invited_at, claimed_at
FROM vehicle_invitations
WHERE email = $1 AND claimed_at IS NULL
ORDER BY invited_at ASC;

-- name: GetInvitationsByEmailAndVehicle :many
SELECT id, vehicle_id, email, invited_at, claimed_at
FROM vehicle_invitations
WHERE email = $1 AND vehicle_id = ANY($2::uuid[])
ORDER BY vehicle_id, invited_at ASC;

-- name: ClaimInvitation :one
UPDATE vehicle_invitations
SET claimed_at = NOW()
WHERE id = $1
RETURNING id, vehicle_id, email, invited_at, claimed_at;

-- name: ClaimInvitationsByEmail :exec
UPDATE vehicle_invitations
SET claimed_at = NOW()
WHERE email = $1 AND claimed_at IS NULL;

-- name: DeleteInvitation :exec
DELETE FROM vehicle_invitations
WHERE id = $1;

-- name: GetInvitationByID :one
SELECT id, vehicle_id, email, invited_at, claimed_at
FROM vehicle_invitations
WHERE id = $1;

-- name: GetAllPendingInvitations :many
SELECT id, vehicle_id, email, token, token_expires_at, invited_at, claimed_at
FROM vehicle_invitations
WHERE claimed_at IS NULL
ORDER BY invited_at ASC;

-- name: GetInvitationByToken :one
SELECT id, vehicle_id, email, token, token_expires_at, invited_at, claimed_at
FROM vehicle_invitations
WHERE token = $1 AND claimed_at IS NULL AND token_expires_at > NOW();
