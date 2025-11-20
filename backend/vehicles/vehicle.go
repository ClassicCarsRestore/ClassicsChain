package vehicles

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Domain errors
var (
	ErrDuplicateChassisNo = errors.New("vehicle with this chassis no already exists")
	ErrVehicleNotFound    = errors.New("vehicle not found")
	ErrInvalidVehicleData = errors.New("invalid vehicle data")
)

// Vehicle represents a classic vehicle in the system
type Vehicle struct {
	ID                 uuid.UUID  `json:"id"`
	OwnerID            *uuid.UUID `json:"ownerId,omitempty"`
	ChassisNumber      *string    `json:"chassisNumber,omitempty"`
	LicensePlate       *string    `json:"licensePlate,omitempty"`
	EngineNumber       *string    `json:"engineNumber,omitempty"`
	TransmissionNumber *string    `json:"transmissionNumber,omitempty"`
	Make               string     `json:"make"`
	Model              string     `json:"model"`
	Year               int        `json:"year"`
	Color              *string    `json:"color,omitempty"`
	BodyType           *string    `json:"bodyType,omitempty"`
	DriveType          *string    `json:"driveType,omitempty"`
	GearType           *string    `json:"gearType,omitempty"`
	SuspensionType     *string    `json:"suspensionType,omitempty"`
	BlockchainAssetID  *string    `json:"blockchainAssetId,omitempty"`
	CID                *string    `json:"cid,omitempty"`
	CIDSourceJSON      *string    `json:"cidSourceJson,omitempty"`
	CIDSourceCBOR      *string    `json:"cidSourceCbor,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

// Owner represents a previous or current owner of a vehicle
type Owner struct {
	OwnerID   uuid.UUID  `json:"ownerId"`
	OwnerName string     `json:"ownerName"`
	StartDate time.Time  `json:"startDate"`
	EndDate   *time.Time `json:"endDate,omitempty"`
}

// CreateVehicleParams represents parameters for creating a new vehicle
type CreateVehicleParams struct {
	ShouldAnchor       bool
	LicensePlate       *string
	ChassisNumber      *string
	Make               string
	Model              string
	Year               int
	Color              *string
	EngineNumber       *string
	TransmissionNumber *string
	BodyType           *string
	DriveType          *string
	GearType           *string
	SuspensionType     *string
	OwnerID            *uuid.UUID
	Documentation      *string
	BlockchainAssetID  *string
}

// UpdateVehicleParams represents parameters for updating an existing vehicle
type UpdateVehicleParams struct {
	LicensePlate       *string
	ChassisNumber      *string
	Make               *string
	Model              *string
	Year               *int
	Color              *string
	EngineNumber       *string
	TransmissionNumber *string
	BodyType           *string
	DriveType          *string
	GearType           *string
	SuspensionType     *string
	OwnerID            *uuid.UUID
	Documentation      *string
	BlockchainAssetID  *string
	IPFSHash           *string
	Verified           *bool
}

// TransferOwnershipParams represents parameters for transferring vehicle ownership
type TransferOwnershipParams struct {
	NewOwnerID   uuid.UUID
	TransferDate time.Time
}
