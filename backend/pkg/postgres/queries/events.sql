-- name: GetEvent :one
SELECT * FROM events
WHERE id = $1 LIMIT 1;

-- name: ListEventsByVehicle :many
SELECT * FROM events
WHERE vehicle_id = $1
ORDER BY event_date DESC;

-- name: ListEventsByEntity :many
SELECT * FROM events
WHERE entity_id = $1
ORDER BY event_date DESC;

-- name: CreateEvent :one
INSERT INTO events (
    vehicle_id,
    entity_id,
    event_type,
    title,
    description,
    event_date,
    location,
    metadata
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8
)
RETURNING *;

-- name: UpdateEvent :one
UPDATE events
SET title = $2,
    description = $3,
    event_date = $4,
    location = $5,
    metadata = $6,
    cid = $7,
    cid_source_json = $8,
    cid_source_cbor_b64 = $9,
    blockchain_tx_id = $10
WHERE id = $1
RETURNING *;

-- name: DeleteEvent :exec
DELETE FROM events
WHERE id = $1;
