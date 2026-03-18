package event

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ClassicCarsRestore/ClassicsChain/internal/vehicles"
	cidpkg "github.com/ClassicCarsRestore/ClassicsChain/pkg/cid"
	"github.com/ClassicCarsRestore/ClassicsChain/pkg/queue"
	"github.com/google/uuid"
)

const (
	SubjectEventAnchor = "anchor.event"

	StatusNone    = "none"
	StatusPending = "pending"
)

// Repository defines the data access interface for events
type Repository interface {
	GetByVehicle(ctx context.Context, vehicleID uuid.UUID, limit, offset int) ([]Event, int, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Event, error)
	Create(ctx context.Context, event Event) (*Event, error)
	Update(ctx context.Context, event Event) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type CIDGenerator interface {
	GenerateCID(data interface{}) (*cidpkg.CID, error)
}

type EventImageService interface {
	ValidateSessionForEvent(ctx context.Context, sessionID uuid.UUID) ([]string, error)
	AttachToEvent(ctx context.Context, sessionID, eventID uuid.UUID) error
}

type EventAnchorJob struct {
	VehicleID     uuid.UUID `json:"vehicleId"`
	EventID       uuid.UUID `json:"eventId"`
	CID           string    `json:"cid"`
	CIDSourceJSON string    `json:"cidSourceJson"`
	CIDSourceCBOR string    `json:"cidSourceCbor"`
	ImageCIDs     []string  `json:"imageCids,omitempty"`
}

// eventCIDRecord is the data structure hashed to produce the event CID.
// Mirrors anchorer.EventRecord but avoids the import cycle.
type eventCIDRecord struct {
	ID          uuid.UUID              `json:"id"`
	EntityID    *uuid.UUID             `json:"entityId,omitempty"`
	Type        *string                `json:"type,omitempty"`
	Title       *string                `json:"title,omitempty"`
	Description *string                `json:"description,omitempty"`
	Date        *time.Time             `json:"date,omitempty"`
	Location    *string                `json:"location,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	ImageCIDs   []string               `json:"imageCids,omitempty"`
	CreatedAt   time.Time              `json:"createdAt,omitempty"`
}

func newEventCIDRecord(e *Event, imageCIDs []string) eventCIDRecord {
	eventType := string(e.Type)
	return eventCIDRecord{
		ID:          e.ID,
		EntityID:    e.EntityID,
		Type:        &eventType,
		Title:       &e.Title,
		Description: e.Description,
		Date:        &e.Date,
		Location:    e.Location,
		Metadata:    e.Metadata,
		ImageCIDs:   imageCIDs,
		CreatedAt:   e.CreatedAt,
	}
}

// Service handles business logic for event management
type Service struct {
	repo              Repository
	publisher         queue.Publisher
	cidGenerator      CIDGenerator
	eventImageService EventImageService
}

// NewService creates a new event service with all dependencies
func NewService(repo Repository, publisher queue.Publisher, cidGenerator CIDGenerator) *Service {
	return &Service{
		repo:         repo,
		publisher:    publisher,
		cidGenerator: cidGenerator,
	}
}

// SetEventImageService sets the event image service (allows optional dependency injection)
func (s *Service) SetEventImageService(eis EventImageService) {
	s.eventImageService = eis
}

// GetByVehicle retrieves events for a specific vehicle
func (s *Service) GetByVehicle(ctx context.Context, vehicleID uuid.UUID, limit, offset int) ([]Event, int, error) {
	return s.repo.GetByVehicle(ctx, vehicleID, limit, offset)
}

// GetByID retrieves an event by its ID
func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Event, error) {
	return s.repo.GetByID(ctx, id)
}

// Create creates a new event and optionally enqueues it for blockchain anchoring
func (s *Service) Create(ctx context.Context, vehicle vehicles.Vehicle, params CreateEventParams) (*Event, error) {
	var imageCIDs []string

	if params.ImageSessionID != nil && s.eventImageService != nil {
		cids, err := s.eventImageService.ValidateSessionForEvent(ctx, *params.ImageSessionID)
		if err != nil {
			return nil, fmt.Errorf("failed to validate image session: %w", err)
		}
		imageCIDs = cids
	}

	eventDate := time.Now().UTC()
	if params.Date != nil {
		eventDate = *params.Date
	}

	evt := Event{
		VehicleID:        params.VehicleID,
		EntityID:         params.EntityID,
		Type:             params.Type,
		Title:            params.Title,
		Description:      params.Description,
		Date:             eventDate,
		Location:         params.Location,
		Metadata:         params.Metadata,
		BlockchainStatus: StatusNone,
	}

	created, err := s.repo.Create(ctx, evt)
	if err != nil {
		return nil, err
	}

	if params.ImageSessionID != nil && s.eventImageService != nil {
		if err := s.eventImageService.AttachToEvent(ctx, *params.ImageSessionID, created.ID); err != nil {
			return nil, fmt.Errorf("failed to attach images to event: %w", err)
		}
	}

	if params.ShouldAnchor {
		record := newEventCIDRecord(created, imageCIDs)
		cidData, err := s.cidGenerator.GenerateCID(record)
		if err != nil {
			return nil, fmt.Errorf("generate event CID: %w", err)
		}

		created.CID = &cidData.CID
		created.CIDSourceJSON = &cidData.SourceJSON
		created.CIDSourceCBOR = &cidData.SourceCBOR
		created.BlockchainStatus = StatusPending

		if err := s.repo.Update(ctx, *created); err != nil {
			return nil, fmt.Errorf("update event with CID: %w", err)
		}

		jobData, err := json.Marshal(EventAnchorJob{
			VehicleID:     vehicle.ID,
			EventID:       created.ID,
			CID:           cidData.CID,
			CIDSourceJSON: cidData.SourceJSON,
			CIDSourceCBOR: cidData.SourceCBOR,
			ImageCIDs:     imageCIDs,
		})
		if err != nil {
			return nil, fmt.Errorf("marshal anchor job: %w", err)
		}
		if err := s.publisher.Publish(ctx, SubjectEventAnchor, jobData); err != nil {
			return nil, fmt.Errorf("enqueue anchor job: %w", err)
		}
	}

	result, err := s.repo.GetByID(ctx, created.ID)
	return result, err
}

// Update updates an existing event
func (s *Service) Update(ctx context.Context, id uuid.UUID, params UpdateEventParams) (*Event, error) {
	evt, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if params.Title != nil {
		evt.Title = *params.Title
	}
	if params.Description != nil {
		evt.Description = params.Description
	}
	if params.EventDate != nil {
		evt.Date = *params.EventDate
	}
	if params.Location != nil {
		evt.Location = params.Location
	}
	if params.Metadata != nil {
		evt.Metadata = params.Metadata
	}

	if err := s.repo.Update(ctx, *evt); err != nil {
		return nil, err
	}

	return evt, nil
}

// Delete deletes an event
func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
