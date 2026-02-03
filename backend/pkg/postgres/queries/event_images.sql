-- name: CreateEventImage :one
INSERT INTO event_images (
    upload_session_id, object_key, upload_url
) VALUES (
    $1, $2, $3
)
RETURNING *;

-- name: GetEventImage :one
SELECT * FROM event_images
WHERE id = $1 LIMIT 1;

-- name: ListEventImagesBySession :many
SELECT * FROM event_images
WHERE upload_session_id = $1
ORDER BY created_at ASC;

-- name: ListEventImagesByEvent :many
SELECT * FROM event_images
WHERE event_id = $1
ORDER BY created_at ASC;

-- name: ConfirmEventImageUpload :one
UPDATE event_images
SET cid = $2, upload_url = NULL
WHERE id = $1
RETURNING *;

-- name: AttachEventImagesToEvent :exec
UPDATE event_images
SET event_id = $2
WHERE upload_session_id = $1;

-- name: DeleteEventImage :exec
DELETE FROM event_images
WHERE id = $1;

-- name: CountEventImagesBySession :one
SELECT COUNT(*) FROM event_images
WHERE upload_session_id = $1;

-- name: ListOrphanedEventImages :many
SELECT * FROM event_images
WHERE event_id IS NULL AND created_at < $1
ORDER BY created_at ASC;

-- name: DeleteOrphanedEventImages :exec
DELETE FROM event_images
WHERE event_id IS NULL AND created_at < $1;
