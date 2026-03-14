package event

import (
	"context"
	"fmt"
	"time"

	"github.com/ClassicCarsRestore/ClassicsChain/vehicles"
	"github.com/google/uuid"
)

// Repository defines the data access interface for events
type Repository interface {
	GetByVehicle(ctx context.Context, vehicleID uuid.UUID, limit, offset int) ([]Event, int, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Event, error)
	Create(ctx context.Context, event Event) (*Event, error)
	Update(ctx context.Context, event Event) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type EventAnchorer interface {
	AnchorEvent(ctx context.Context, vehicle vehicles.Vehicle, event Event, imageCIDs []string) error
}

type EventImageService interface {
	ValidateSessionForEvent(ctx context.Context, sessionID uuid.UUID) ([]string, error)
	AttachToEvent(ctx context.Context, sessionID, eventID uuid.UUID) error
}

// Service handles business logic for event management
type Service struct {
	repo              Repository
	anchorer          EventAnchorer
	eventImageService EventImageService
}

// NewService creates a new event service with all dependencies
func NewService(repo Repository, anchorer EventAnchorer) *Service {
	return &Service{
		repo:     repo,
		anchorer: anchorer,
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

// Create creates a new event
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

	event := Event{
		VehicleID:   params.VehicleID,
		EntityID:    params.EntityID,
		Type:        params.Type,
		Title:       params.Title,
		Description: params.Description,
		Date:        eventDate,
		Location:    params.Location,
		Metadata:    params.Metadata,
	}

	created, err := s.repo.Create(ctx, event)
	if err != nil {
		return nil, err
	}

	if params.ImageSessionID != nil && s.eventImageService != nil {
		if err := s.eventImageService.AttachToEvent(ctx, *params.ImageSessionID, created.ID); err != nil {
			return nil, fmt.Errorf("failed to attach images to event: %w", err)
		}
	}

	if params.ShouldAnchor {
		if err := s.anchorer.AnchorEvent(ctx, vehicle, *created, imageCIDs); err != nil {
			return nil, err
		}
	}

	evt, err := s.repo.GetByID(ctx, created.ID)

	return evt, err
}

// Update updates an existing event
func (s *Service) Update(ctx context.Context, id uuid.UUID, params UpdateEventParams) (*Event, error) {
	event, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if params.Title != nil {
		event.Title = *params.Title
	}
	if params.Description != nil {
		event.Description = params.Description
	}
	if params.EventDate != nil {
		event.Date = *params.EventDate
	}
	if params.Location != nil {
		event.Location = params.Location
	}
	if params.Metadata != nil {
		event.Metadata = params.Metadata
	}

	if err := s.repo.Update(ctx, *event); err != nil {
		return nil, err
	}

	return event, nil
}

// Delete deletes an event
func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
