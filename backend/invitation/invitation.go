package invitation

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrInvitationNotFound = errors.New("invitation not found")
)

// Invitation represents a vehicle ownership invitation in the system
type Invitation struct {
	ID             uuid.UUID  `json:"id"`
	VehicleID      uuid.UUID  `json:"vehicleId"`
	Email          string     `json:"email"`
	Token          *string    `json:"token,omitempty"`
	TokenExpiresAt *time.Time `json:"tokenExpiresAt,omitempty"`
	InvitedAt      time.Time  `json:"invitedAt"`
	ClaimedAt      *time.Time `json:"claimedAt,omitempty"`
}

// CreateInvitationParams represents parameters for creating a new invitation
type CreateInvitationParams struct {
	VehicleID      uuid.UUID
	Email          string
	Token          string
	TokenExpiresAt time.Time
}
