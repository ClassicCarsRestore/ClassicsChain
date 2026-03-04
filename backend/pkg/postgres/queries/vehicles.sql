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
    fuel,
    engine_cc,
    engine_cylinders,
    engine_power_hp,
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
$13,
$14,
$15,
$16,
$17
)
RETURNING *;

-- name: UpdateVehicle :one
UPDATE vehicles
SET license_plate = $2, chassis_number = $3, make = $4, model = $5,
    year = $6, color = $7, engine_number = $8, transmission_number = $9,
    body_type = $10, drive_type = $11, gear_type = $12, suspension_type = $13,
    fuel = $14, engine_cc = $15, engine_cylinders = $16, engine_power_hp = $17,
    owner_id = $18, blockchain_asset_id = $19, cid = $20, cid_source_json = $21, cid_source_cbor_b64 = $22,
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

-- name: ListVehiclesWithStats :many
SELECT
    v.*,
    COALESCE(stats.certified_events_count, 0)::bigint AS certified_events_count,
    COALESCE(stats.owner_events_count, 0)::bigint AS owner_events_count,
    COALESCE(stats.active_certifications_count, 0)::bigint AS active_certifications_count
FROM vehicles v
LEFT JOIN (
    SELECT
        e.vehicle_id,
        COUNT(*) FILTER (WHERE e.entity_id IS NOT NULL) AS certified_events_count,
        COUNT(*) FILTER (WHERE e.entity_id IS NULL) AS owner_events_count,
        COUNT(*) FILTER (
            WHERE e.event_type = 'certification'
            AND (
                e.metadata->>'validityEndDate' IS NULL
                OR (e.metadata->>'validityEndDate')::date >= CURRENT_DATE
            )
        ) AS active_certifications_count
    FROM events e
    GROUP BY e.vehicle_id
) stats ON v.id = stats.vehicle_id
ORDER BY v.created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListVehiclesByOwnerWithStats :many
SELECT
    v.*,
    COALESCE(stats.certified_events_count, 0)::bigint AS certified_events_count,
    COALESCE(stats.owner_events_count, 0)::bigint AS owner_events_count,
    COALESCE(stats.active_certifications_count, 0)::bigint AS active_certifications_count
FROM vehicles v
LEFT JOIN (
    SELECT
        e.vehicle_id,
        COUNT(*) FILTER (WHERE e.entity_id IS NOT NULL) AS certified_events_count,
        COUNT(*) FILTER (WHERE e.entity_id IS NULL) AS owner_events_count,
        COUNT(*) FILTER (
            WHERE e.event_type = 'certification'
            AND (
                e.metadata->>'validityEndDate' IS NULL
                OR (e.metadata->>'validityEndDate')::date >= CURRENT_DATE
            )
        ) AS active_certifications_count
    FROM events e
    GROUP BY e.vehicle_id
) stats ON v.id = stats.vehicle_id
WHERE v.owner_id = $1
ORDER BY v.created_at DESC
LIMIT $2 OFFSET $3;
