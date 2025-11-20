package event

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrEventNotFound = errors.New("event not found")
)

// Event represents a vehicle history event in the system
type Event struct {
	ID             uuid.UUID              `json:"id"`
	VehicleID      uuid.UUID              `json:"vehicleId"`
	EntityID       *uuid.UUID             `json:"entityId"`
	Type           EventType              `json:"type"`
	Title          string                 `json:"title"`
	Description    *string                `json:"description,omitempty"`
	Date           time.Time              `json:"date"`
	Location       *string                `json:"location,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	BlockchainTxID *string                `json:"blockchainTxId,omitempty"`
	CID            *string                `json:"cid,omitempty"`
	CIDSourceJSON  *string                `json:"cidSourceJson,omitempty"`
	CIDSourceCBOR  *string                `json:"cidSourceCbor,omitempty"`
	CreatedAt      time.Time              `json:"createdAt"`
}

// EventType represents the type of vehicle history event
type EventType string

const (
	TypeCertification     EventType = "certification"
	TypeCarShow           EventType = "car_show"
	TypeClassicMeet       EventType = "classic_meet"
	TypeRally             EventType = "rally"
	TypeVintageRacing     EventType = "vintage_racing"
	TypeAuction           EventType = "auction"
	TypeWorkshop          EventType = "workshop"
	TypeClubCompetition   EventType = "club_competition"
	TypeRoadTrip          EventType = "road_trip"
	TypeFestival          EventType = "festival"
	TypeRaceParticipation EventType = "race_participation"
	TypeShowParticipation EventType = "show_participation"
	TypeMaintenance       EventType = "maintenance"
	TypeOwnershipTransfer EventType = "ownership_transfer"
	TypeRestoration       EventType = "restoration"
	TypeModification      EventType = "modification"
)

// CreateEventParams represents parameters for creating a new event
// If Date is nil, it will be set to the current time (NOW() UTC) by the service
type CreateEventParams struct {
	ShouldAnchor bool
	VehicleID    uuid.UUID
	EntityID     *uuid.UUID
	Type         EventType
	Title        string
	Description  *string
	Date         *time.Time
	Location     *string
	Metadata     map[string]interface{}
}

// UpdateEventParams represents parameters for updating an existing event
type UpdateEventParams struct {
	Title          *string
	Description    *string
	EventDate      *time.Time
	Location       *string
	Metadata       map[string]interface{}
	BlockchainTxID *string
	CID            *string
	CIDSourceJSON  *string
	CIDSourceCBOR  *string
}
