-- name: GetVehicle :one
SELECT * FROM vehicles
WHERE id = $1 LIMIT 1;

-- name: ListVehiclesByOwner :many
SELECT * FROM vehicles
WHERE owner_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListVehicles :many
SELECT * FROM vehicles
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountVehicles :one
SELECT COUNT(*) FROM vehicles;

-- name: CountVehiclesByOwner :one
SELECT COUNT(*) FROM vehicles
WHERE owner_id = $1;

-- name: CreateVehicle :one
INSERT INTO vehicles (
    license_plate,
    chassis_number,
    make,
    model,
    year,
    color,
    engine_number,
    transmission_number,
    body_type,
    drive_type,
    gear_type,
    suspension_type,
    owner_id
) VALUES (
$1,
$2,
$3,
$4,
$5,
$6,
$7,
$8,
$9,
$10,
$11,
$12,
$13
)
RETURNING *;

-- name: UpdateVehicle :one
UPDATE vehicles
SET license_plate = $2, chassis_number = $3, make = $4, model = $5,
    year = $6, color = $7, engine_number = $8, transmission_number = $9,
    body_type = $10, drive_type = $11, gear_type = $12, suspension_type = $13,
    owner_id = $14, blockchain_asset_id = $15, cid = $16, cid_source_json = $17, cid_source_cbor_b64 = $18,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteVehicle :exec
DELETE FROM vehicles
WHERE id = $1;

-- name: ClaimVehicle :one
UPDATE vehicles
SET owner_id = $2, updated_at = NOW()
WHERE id = $1 AND owner_id IS NULL
RETURNING *;

-- name: GetVehicleByChassisNumber :one
SELECT * FROM vehicles
WHERE chassis_number = $1 LIMIT 1;

-- name: GetVehicleByLicensePlate :one
SELECT * FROM vehicles
WHERE license_plate = $1 LIMIT 1;
