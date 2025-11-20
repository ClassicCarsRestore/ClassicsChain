-- name: CreateShareLink :one
INSERT INTO vehicle_share_links (
  vehicle_id,
  token,
  can_view_details,
  can_view_photos,
  can_view_documents,
  can_view_history,
  recipient_email,
  expires_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetShareLinkByToken :one
SELECT * FROM vehicle_share_links
WHERE token = $1 AND revoked_at IS NULL;

-- name: GetShareLinkByID :one
SELECT * FROM vehicle_share_links
WHERE id = $1;

-- name: ListShareLinksByVehicle :many
SELECT * FROM vehicle_share_links
WHERE vehicle_id = $1 AND revoked_at IS NULL
ORDER BY created_at DESC;

-- name: IncrementShareLinkAccessCount :one
UPDATE vehicle_share_links
SET accessed_count = accessed_count + 1,
    last_accessed_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: RevokeShareLink :one
UPDATE vehicle_share_links
SET revoked_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteExpiredShareLinks :exec
DELETE FROM vehicle_share_links
WHERE expires_at < CURRENT_TIMESTAMP AND revoked_at IS NULL;
