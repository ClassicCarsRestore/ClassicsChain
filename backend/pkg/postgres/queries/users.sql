-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1;

-- name: CreateUser :one
INSERT INTO users (
    id,
    is_admin
) VALUES (
    $1,
    $2
) RETURNING *;

-- name: UpdateUser :one
UPDATE users
SET is_admin = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;

-- name: ListUsers :many
SELECT * FROM users
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetUserEntityMemberships :many
SELECT ue.*, e.name as entity_name, e.entity_type
FROM user_entity ue
JOIN entities e ON ue.entity_id = e.id
WHERE ue.user_id = $1
ORDER BY ue.added_at DESC;

-- name: GetEntityMembers :many
SELECT ue.*, u.is_admin
FROM user_entity ue
JOIN users u ON ue.user_id = u.id
WHERE ue.entity_id = $1
ORDER BY ue.added_at DESC;

-- name: AddUserToEntity :one
INSERT INTO user_entity (
    user_id,
    entity_id,
    role
) VALUES (
    $1,
    $2,
    $3
) RETURNING *;

-- name: RemoveUserFromEntity :exec
DELETE FROM user_entity
WHERE user_id = $1 AND entity_id = $2;

-- name: UpdateUserEntityRole :one
UPDATE user_entity
SET role = $3
WHERE user_id = $1 AND entity_id = $2
RETURNING *;

-- name: GetUserEntityRole :one
SELECT role FROM user_entity
WHERE user_id = $1 AND entity_id = $2;

-- name: CheckUserEntityMembership :one
SELECT EXISTS(
    SELECT 1 FROM user_entity
    WHERE user_id = $1 AND entity_id = $2
) AS is_member;
