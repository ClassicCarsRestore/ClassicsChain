package anchorjob

import "github.com/google/uuid"

const (
	SubjectVehicleGenesis = "anchor.vehicle"
	SubjectEventAnchor    = "anchor.event"
)

type VehicleGenesisJob struct {
	VehicleID uuid.UUID `json:"vehicleId"`
}

type EventAnchorJob struct {
	VehicleID     uuid.UUID `json:"vehicleId"`
	EventID       uuid.UUID `json:"eventId"`
	CID           string    `json:"cid"`
	CIDSourceJSON string    `json:"cidSourceJson"`
	CIDSourceCBOR string    `json:"cidSourceCbor"`
	ImageCIDs     []string  `json:"imageCids,omitempty"`
}
