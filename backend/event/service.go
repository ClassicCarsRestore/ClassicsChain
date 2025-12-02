package event

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/s1moe2/classics-chain/vehicles"
)

// Repository defines the data access interface for events
type Repository interface {
	GetByVehicle(ctx context.Context, vehicleID uuid.UUID, limit, offset int) ([]Event, int, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Event, error)
	Create(ctx context.Context, event Event) (*Event, error)
	Update(ctx context.Context, event Event) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type VehicleRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (*vehicles.Vehicle, error)
}

type EventAnchorer interface {
	AnchorEvent(ctx context.Context, vehicle vehicles.Vehicle, event Event) error
}

type InvitationService interface {
	CreateInvitation(ctx context.Context, vehicleID uuid.UUID, email string) error
	SendInvitationBatch(ctx context.Context, email string, vehicleIDs []uuid.UUID, vehicleData []map[string]interface{}) error
}

type VehicleService interface {
	FindOrCreateVehicle(ctx context.Context, chassisNumber, licensePlate *string) (*vehicles.Vehicle, error)
}

// Service handles business logic for event management
type Service struct {
	repo              Repository
	anchorer          EventAnchorer
	vehicleService    VehicleService
	invitationService InvitationService
}

// NewService creates a new event service with all dependencies
func NewService(repo Repository, anchorer EventAnchorer, vehicleService VehicleService, invitationService InvitationService) *Service {
	return &Service{
		repo:              repo,
		anchorer:          anchorer,
		vehicleService:    vehicleService,
		invitationService: invitationService,
	}
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

	if params.ShouldAnchor {
		if err := s.anchorer.AnchorEvent(ctx, vehicle, *created); err != nil {
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

// BulkEventVehicle represents a vehicle in a bulk event creation request
type BulkEventVehicle struct {
	ChassisNumber *string
	LicensePlate  *string
	Email         *string
}

// BulkEventResult represents the result of bulk event creation
type BulkEventResult struct {
	Success []BulkEventSuccess
	Errors  []BulkEventError
}

// BulkEventSuccess represents a successfully created event
type BulkEventSuccess struct {
	VehicleID      uuid.UUID
	EventID        uuid.UUID
	Created        bool
	InvitationSent *bool
}

// BulkEventError represents an error during event creation
type BulkEventError struct {
	ChassisNumber string
	LicensePlate  string
	Error         string
}

// CreateBulkEventsParams contains parameters for creating bulk events
type CreateBulkEventsParams struct {
	Vehicles    []BulkEventVehicle
	EntityID    *uuid.UUID
	Title       string
	Description *string
	Type        EventType
	Location    *string
	Date        *time.Time
	Metadata    map[string]interface{}
}

// CreateBulkEvents orchestrates the creation of events for multiple vehicles with optional invitations
func (s *Service) CreateBulkEvents(ctx context.Context, params CreateBulkEventsParams) (*BulkEventResult, error) {
	result := &BulkEventResult{
		Success: []BulkEventSuccess{},
		Errors:  []BulkEventError{},
	}

	if len(params.Vehicles) == 0 {
		return result, nil
	}

	// Batch invitations by email for efficient email sending
	invitationsByEmail := make(map[string][]map[string]interface{})
	successByEmail := make(map[string][]uuid.UUID)

	for _, vhicle := range params.Vehicles {
		vehicle, err := s.vehicleService.FindOrCreateVehicle(ctx, vhicle.ChassisNumber, vhicle.LicensePlate)
		if err != nil {
			chassisNum := ""
			if vhicle.ChassisNumber != nil {
				chassisNum = *vhicle.ChassisNumber
			}
			licensePlate := ""
			if vhicle.LicensePlate != nil {
				licensePlate = *vhicle.LicensePlate
			}
			result.Errors = append(result.Errors, BulkEventError{
				ChassisNumber: chassisNum,
				LicensePlate:  licensePlate,
				Error:         fmt.Sprintf("failed to find or create vehicle: %v", err),
			})
			continue
		}

		if vehicle == nil {
			chassisNum := ""
			if vhicle.ChassisNumber != nil {
				chassisNum = *vhicle.ChassisNumber
			}
			licensePlate := ""
			if vhicle.LicensePlate != nil {
				licensePlate = *vhicle.LicensePlate
			}
			result.Errors = append(result.Errors, BulkEventError{
				ChassisNumber: chassisNum,
				LicensePlate:  licensePlate,
				Error:         "failed to create vehicle",
			})
			continue
		}

		// Create event
		createEventParams := CreateEventParams{
			VehicleID:    vehicle.ID,
			EntityID:     params.EntityID,
			Title:        params.Title,
			Description:  params.Description,
			Type:         params.Type,
			Location:     params.Location,
			Date:         params.Date,
			Metadata:     params.Metadata,
			ShouldAnchor: true,
		}

		createdEvent, err := s.Create(ctx, *vehicle, createEventParams)
		if err != nil {
			chassisNum := ""
			if vhicle.ChassisNumber != nil {
				chassisNum = *vhicle.ChassisNumber
			}
			licensePlate := ""
			if vhicle.LicensePlate != nil {
				licensePlate = *vhicle.LicensePlate
			}
			result.Errors = append(result.Errors, BulkEventError{
				ChassisNumber: chassisNum,
				LicensePlate:  licensePlate,
				Error:         fmt.Sprintf("failed to create event: %v", err),
			})
			continue
		}

		invitationSent := false

		// Create invitation if email provided and vehicle is unowned
		if vhicle.Email != nil && *vhicle.Email != "" && vehicle.OwnerID == nil {
			email := *vhicle.Email
			if err := s.invitationService.CreateInvitation(ctx, vehicle.ID, email); err != nil {
				result.Errors = append(result.Errors, BulkEventError{
					ChassisNumber: getStringValue(vhicle.ChassisNumber),
					LicensePlate:  getStringValue(vhicle.LicensePlate),
					Error:         fmt.Sprintf("failed to create invitation: %v", err),
				})
				continue
			}

			// Collect vehicle data for batched email sending
			vehicleData := map[string]interface{}{
				"make":  vehicle.Make,
				"model": vehicle.Model,
				"year":  vehicle.Year,
			}
			if vehicle.LicensePlate != nil {
				vehicleData["licensePlate"] = *vehicle.LicensePlate
			}

			invitationsByEmail[email] = append(invitationsByEmail[email], vehicleData)
			successByEmail[email] = append(successByEmail[email], vehicle.ID)
			invitationSent = true
		}

		result.Success = append(result.Success, BulkEventSuccess{
			VehicleID:      vehicle.ID,
			EventID:        createdEvent.ID,
			Created:        vhicle.ChassisNumber == nil && vhicle.LicensePlate == nil,
			InvitationSent: &invitationSent,
		})
	}

	// Send batched invitation emails
	for email, vehicles := range invitationsByEmail {
		if vehicleIDs, ok := successByEmail[email]; ok {
			if err := s.invitationService.SendInvitationBatch(ctx, email, vehicleIDs, vehicles); err != nil {
				// Log error but don't fail the entire operation
				fmt.Printf("failed to send invitation email to %s: %v\n", email, err)
			}
		}
	}

	return result, nil
}

func getStringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
