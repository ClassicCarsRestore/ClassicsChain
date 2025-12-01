package user_invitation

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrInvitationNotFound = errors.New("invitation not found")
	ErrInvitationExpired  = errors.New("invitation has expired")
	ErrInvitationClaimed  = errors.New("invitation has already been claimed")
)

type InvitationType string

const (
	TypeAdmin        InvitationType = "admin"
	TypeEntityMember InvitationType = "entity_member"
)

type UserInvitation struct {
	ID             uuid.UUID
	Email          string
	Name           *string
	Token          string
	TokenExpiresAt time.Time
	EntityID       *uuid.UUID
	InvitationType InvitationType
	EntityRole     *string
	InvitedAt      time.Time
	ClaimedAt      *time.Time
}

type CreateUserInvitationParams struct {
	Email          string
	Name           *string
	Token          string
	TokenExpiresAt time.Time
	EntityID       *uuid.UUID
	InvitationType InvitationType
	EntityRole     *string
}

type CreateAdminInvitationParams struct {
	Email string
	Name  *string
}

type CreateEntityMemberInvitationParams struct {
	Email      string
	Name       *string
	EntityID   uuid.UUID
	EntityName string
	Role       string
}
