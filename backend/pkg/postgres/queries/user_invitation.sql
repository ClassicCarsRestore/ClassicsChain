-- name: CreateUserInvitation :one
INSERT INTO user_invitations (
    email,
    name,
    token,
    token_expires_at,
    invitation_type,
    entity_id,
    entity_role
)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetPendingUserInvitationsByEmail :many
SELECT *
FROM user_invitations
WHERE email = $1
  AND claimed_at IS NULL
ORDER BY invited_at ASC;

-- name: GetUserInvitationByToken :one
SELECT *
FROM user_invitations
WHERE token = $1
  AND claimed_at IS NULL
  AND token_expires_at > NOW();

-- name: ClaimUserInvitation :exec
UPDATE user_invitations
SET claimed_at = NOW()
WHERE token = $1;

-- name: GetUserInvitationByID :one
SELECT *
FROM user_invitations
WHERE id = $1;

-- name: DeleteUserInvitation :exec
DELETE FROM user_invitations
WHERE id = $1;
