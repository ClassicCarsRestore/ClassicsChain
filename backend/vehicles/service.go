package vehicles

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

// Repository defines the data access interface for vehicles
type Repository interface {
	GetAll(ctx context.Context, limit, offset int, ownerID *uuid.UUID) ([]Vehicle, int, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Vehicle, error)
	GetByOwnerID(ctx context.Context, ownerID uuid.UUID, limit, offset int) ([]Vehicle, int, error)
	GetByChassisNumber(ctx context.Context, chassisNumber string) (*Vehicle, error)
	GetByLicensePlate(ctx context.Context, licensePlate string) (*Vehicle, error)
	Create(ctx context.Context, vehicle *Vehicle) (*Vehicle, error)
	Update(ctx context.Context, vehicle *Vehicle) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type VehicleAnchorer interface {
	VehicleGenesis(ctx context.Context, vehicle Vehicle) (*string, error)
}

// Service handles business logic for vehicle management
type Service struct {
	repo     Repository
	anchorer VehicleAnchorer
}

// NewService creates a new vehicle service
func NewService(repo Repository, anchorer VehicleAnchorer) *Service {
	return &Service{repo, anchorer}
}

// GetAll retrieves paginated vehicles with optional owner filter
func (s *Service) GetAll(ctx context.Context, limit, offset int, ownerID *uuid.UUID) ([]Vehicle, int, error) {
	return s.repo.GetAll(ctx, limit, offset, ownerID)
}

// GetByID retrieves a vehicle by its ID
func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Vehicle, error) {
	return s.repo.GetByID(ctx, id)
}

// GetByOwnerID retrieves all vehicles owned by a specific owner
func (s *Service) GetByOwnerID(ctx context.Context, ownerID uuid.UUID, limit, offset int) ([]Vehicle, int, error) {
	return s.repo.GetByOwnerID(ctx, ownerID, limit, offset)
}

// Create creates a new vehicle
func (s *Service) Create(ctx context.Context, params CreateVehicleParams) (*Vehicle, error) {
	vehicle := &Vehicle{
		LicensePlate:       params.LicensePlate,
		ChassisNumber:      params.ChassisNumber,
		Make:               params.Make,
		Model:              params.Model,
		Year:               params.Year,
		Color:              params.Color,
		EngineNumber:       params.EngineNumber,
		TransmissionNumber: params.TransmissionNumber,
		BodyType:           params.BodyType,
		DriveType:          params.DriveType,
		GearType:           params.GearType,
		SuspensionType:     params.SuspensionType,
		OwnerID:            params.OwnerID,
		BlockchainAssetID:  params.BlockchainAssetID,
	}

	created, err := s.repo.Create(ctx, vehicle)
	if err != nil {
		return nil, err
	}

	if params.ShouldAnchor {
		if _, err := s.anchorer.VehicleGenesis(ctx, *created); err != nil {
			return nil, err
		}
	}

	return created, nil
}

// Update updates an existing vehicle
func (s *Service) Update(ctx context.Context, id uuid.UUID, params UpdateVehicleParams) (*Vehicle, error) {
	vehicle, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if params.LicensePlate != nil {
		vehicle.LicensePlate = params.LicensePlate
	}
	if params.ChassisNumber != nil {
		vehicle.ChassisNumber = params.ChassisNumber
	}
	if params.Make != nil {
		vehicle.Make = *params.Make
	}
	if params.Model != nil {
		vehicle.Model = *params.Model
	}
	if params.Year != nil {
		vehicle.Year = *params.Year
	}
	if params.Color != nil {
		vehicle.Color = params.Color
	}
	if params.EngineNumber != nil {
		vehicle.EngineNumber = params.EngineNumber
	}
	if params.TransmissionNumber != nil {
		vehicle.TransmissionNumber = params.TransmissionNumber
	}
	if params.BodyType != nil {
		vehicle.BodyType = params.BodyType
	}
	if params.DriveType != nil {
		vehicle.DriveType = params.DriveType
	}
	if params.GearType != nil {
		vehicle.GearType = params.GearType
	}
	if params.SuspensionType != nil {
		vehicle.SuspensionType = params.SuspensionType
	}

	vehicle.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, vehicle); err != nil {
		return nil, err
	}

	return vehicle, nil
}

// Delete deletes a vehicle
func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

// ClaimVehicleOwnership allows a user to claim an ownerless vehicle
func (s *Service) ClaimVehicleOwnership(ctx context.Context, claimerID uuid.UUID, vehicleID uuid.UUID) (*Vehicle, error) {
	vehicle, err := s.repo.GetByID(ctx, vehicleID)
	if err != nil {
		return nil, err
	}

	// Vehicle must be ownerless to be claimed
	if vehicle.OwnerID != nil {
		return nil, nil
	}

	// Update vehicle ownership
	vehicle.OwnerID = &claimerID
	vehicle.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, vehicle); err != nil {
		return nil, err
	}

	return vehicle, nil
}

// FindOrCreateVehicle searches for a vehicle by chassis number (priority) or license plate
// If not found, creates a new orphaned vehicle with minimal information
// Prioritizes chassis number if both are provided and match different vehicles
func (s *Service) FindOrCreateVehicle(ctx context.Context, chassisNumber, licensePlate *string) (*Vehicle, error) {
	// Try to find by chassis number first (has priority)
	if chassisNumber != nil && *chassisNumber != "" {
		vehicle, err := s.repo.GetByChassisNumber(ctx, *chassisNumber)
		if err == nil {
			return vehicle, nil
		}
		if !errors.Is(err, ErrVehicleNotFound) {
			return nil, err
		}
	}

	// Try to find by license plate
	if licensePlate != nil && *licensePlate != "" {
		vehicle, err := s.repo.GetByLicensePlate(ctx, *licensePlate)
		if err == nil {
			return vehicle, nil
		}
		if !errors.Is(err, ErrVehicleNotFound) {
			return nil, err
		}
	}

	// Vehicle not found, create a new orphaned vehicle with minimal information
	newVehicle := &Vehicle{
		ID:            uuid.New(),
		LicensePlate:  licensePlate,
		ChassisNumber: chassisNumber,
		Make:          "Unknown",
		Model:         "Unknown",
		Year:          0,
		OwnerID:       nil, // Orphaned
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	created, err := s.repo.Create(ctx, newVehicle)
	if err != nil {
		return nil, err
	}

	return created, nil
}

// AssignOwnership assigns ownership of a vehicle to a user
// This is used when an invited user completes registration
func (s *Service) AssignOwnership(ctx context.Context, vehicleID uuid.UUID, ownerID uuid.UUID) error {
	vehicle, err := s.repo.GetByID(ctx, vehicleID)
	if err != nil {
		return err
	}

	if vehicle == nil {
		return nil
	}

	vehicle.OwnerID = &ownerID
	vehicle.UpdatedAt = time.Now()

	return s.repo.Update(ctx, vehicle)
}
