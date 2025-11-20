-- name: ListPhotosByVehicle :many
SELECT * FROM vehicle_photos
WHERE vehicle_id = $1
ORDER BY created_at DESC;

-- name: GetPhoto :one
SELECT * FROM vehicle_photos
WHERE id = $1 LIMIT 1;

-- name: GetPhotoByKey :one
SELECT * FROM vehicle_photos
WHERE vehicle_id = $1 AND object_key = $2 LIMIT 1;

-- name: CreatePhoto :one
INSERT INTO vehicle_photos (
    vehicle_id, object_key, upload_url
) VALUES (
    $1, $2, $3
)
RETURNING *;

-- name: ConfirmPhotoUpload :one
UPDATE vehicle_photos
SET upload_url = NULL
WHERE id = $1
RETURNING *;

-- name: DeletePhoto :exec
DELETE FROM vehicle_photos
WHERE id = $1;

-- name: CountPhotosByVehicle :one
SELECT COUNT(*) FROM vehicle_photos
WHERE vehicle_id = $1;
