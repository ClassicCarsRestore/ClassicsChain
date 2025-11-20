-- name: GetEntity :one
SELECT * FROM entities
WHERE id = $1 LIMIT 1;

-- name: ListEntities :many
SELECT * FROM entities
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListEntitiesByType :many
SELECT * FROM entities
WHERE entity_type = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountEntities :one
SELECT COUNT(*) FROM entities;

-- name: CountEntitiesByType :one
SELECT COUNT(*) FROM entities
WHERE entity_type = $1;

-- name: CreateEntity :one
INSERT INTO entities (
    name, entity_type, description, contact_email, website, address, certified_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: UpdateEntity :one
UPDATE entities
SET name = $2, description = $3, contact_email = $4, website = $5, address = $6, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteEntity :exec
DELETE FROM entities
WHERE id = $1;
