package user

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Domain errors
var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyAdmin  = errors.New("user is already an admin")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrUserNotAdmin      = errors.New("user is not an admin")
	ErrAlreadyMember     = errors.New("user already member of entity")
	ErrNotMember         = errors.New("user not member of entity")
)

// User represents a user in the system
type User struct {
	ID        uuid.UUID `json:"id"`
	IsAdmin   bool      `json:"isAdmin"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// AdminUserWithTraits represents an admin user with data from both database and Kratos
type AdminUserWithTraits struct {
	ID    uuid.UUID
	Email string
	Name  *string
}

// EntityMembership represents a user's membership in an entity
type EntityMembership struct {
	UserID     uuid.UUID `json:"userId"`
	EntityID   uuid.UUID `json:"entityId"`
	Role       string    `json:"role"` // "admin" or "member"
	EntityName *string   `json:"entityName,omitempty"`
	EntityType *string   `json:"entityType,omitempty"`
}

// CreateUserParams represents parameters for creating a new user
type CreateUserParams struct {
	ID      uuid.UUID
	IsAdmin bool
}

// UpdateUserParams represents parameters for updating an existing user
type UpdateUserParams struct {
	IsAdmin *bool
}

// AddMembershipParams represents parameters for adding a user to an entity
type AddMembershipParams struct {
	UserID   uuid.UUID
	EntityID uuid.UUID
	Role     string
}
