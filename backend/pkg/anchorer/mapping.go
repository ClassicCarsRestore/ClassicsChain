package anchorer

import (
	"time"

	"github.com/google/uuid"
	"github.com/s1moe2/classics-chain/event"
	"github.com/s1moe2/classics-chain/vehicles"
)

// VehicleRecord represents the structure of a vehicle stored in IPFS
// Warning: handle with care! Changes to this structure may affect IPFS data integrity.
type VehicleRecord struct {
	ID                 uuid.UUID  `json:"id"`
	LicensePlate       *string    `json:"licensePlate,omitempty"`
	ChassisNumber      *string    `json:"chassisNumber,omitempty"`
	Make               *string    `json:"make,omitempty"`
	Model              *string    `json:"model,omitempty"`
	Year               *int       `json:"year,omitempty"`
	Color              *string    `json:"color,omitempty"`
	EngineNumber       *string    `json:"engineNumber,omitempty"`
	TransmissionNumber *string    `json:"transmissionNumber,omitempty"`
	BodyType           *string    `json:"bodyType,omitempty"`
	DriveType          *string    `json:"driveType,omitempty"`
	GearType           *string    `json:"gearType,omitempty"`
	SuspensionType     *string    `json:"suspensionType,omitempty"`
	OwnerID            *uuid.UUID `json:"ownerId,omitempty"`
	CreatedAt          time.Time  `json:"createdAt,omitempty"`
}

type EventRecord struct {
	ID          uuid.UUID              `json:"id"`
	EntityID    *uuid.UUID             `json:"entityId,omitempty"`
	Type        *string                `json:"type,omitempty"`
	Title       *string                `json:"title,omitempty"`
	Description *string                `json:"description,omitempty"`
	Date        *time.Time             `json:"date,omitempty"`
	Location    *string                `json:"location,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt   time.Time              `json:"createdAt,omitempty"`
}

func vehicleToVehicleRecord(v vehicles.Vehicle) VehicleRecord {
	return VehicleRecord{
		ID:                 v.ID,
		LicensePlate:       v.LicensePlate,
		ChassisNumber:      v.ChassisNumber,
		Make:               &v.Make,
		Model:              &v.Model,
		Year:               &v.Year,
		Color:              v.Color,
		EngineNumber:       v.EngineNumber,
		TransmissionNumber: v.TransmissionNumber,
		BodyType:           v.BodyType,
		DriveType:          v.DriveType,
		GearType:           v.GearType,
		SuspensionType:     v.SuspensionType,
		OwnerID:            v.OwnerID,
		CreatedAt:          v.CreatedAt,
	}
}

func eventToEventRecord(e event.Event) EventRecord {
	return EventRecord{
		ID:          e.ID,
		EntityID:    e.EntityID,
		Type:        ptr(string(e.Type)),
		Title:       &e.Title,
		Description: e.Description,
		Date:        &e.Date,
		Location:    e.Location,
		Metadata:    e.Metadata,
		CreatedAt:   e.CreatedAt,
	}
}
