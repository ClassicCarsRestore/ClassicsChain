-- name: ListDocumentsByVehicle :many
SELECT * FROM vehicle_documents
WHERE vehicle_id = $1
ORDER BY created_at DESC;

-- name: GetDocument :one
SELECT * FROM vehicle_documents
WHERE id = $1 LIMIT 1;

-- name: GetDocumentByKey :one
SELECT * FROM vehicle_documents
WHERE vehicle_id = $1 AND object_key = $2 LIMIT 1;

-- name: CreateDocument :one
INSERT INTO vehicle_documents (
    vehicle_id, object_key, filename, upload_url
) VALUES (
    $1, $2, $3, $4
)
RETURNING *;

-- name: ConfirmDocumentUpload :one
UPDATE vehicle_documents
SET upload_url = NULL
WHERE id = $1
RETURNING *;

-- name: DeleteDocument :exec
DELETE FROM vehicle_documents
WHERE id = $1;

-- name: CountDocumentsByVehicle :one
SELECT COUNT(*) FROM vehicle_documents
WHERE vehicle_id = $1;
