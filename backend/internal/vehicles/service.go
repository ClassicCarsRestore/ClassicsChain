package vehicles

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/ClassicCarsRestore/ClassicsChain/pkg/queue"
	"github.com/google/uuid"
)

const (
	SubjectVehicleGenesis = "anchor.vehicle"

	StatusNone    = "none"
	StatusPending = "pending"
)

// Repository defines the data access interface for vehicles
type Repository interface {
	GetAll(ctx context.Context, limit, offset int, ownerID *uuid.UUID) ([]Vehicle, int, error)
	GetAllWithStats(ctx context.Context, limit, offset int, ownerID *uuid.UUID) ([]VehicleWithStats, int, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Vehicle, error)
	GetByOwnerID(ctx context.Context, ownerID uuid.UUID, limit, offset int) ([]Vehicle, int, error)
	GetByChassisNumber(ctx context.Context, chassisNumber string) (*Vehicle, error)
	GetByLicensePlate(ctx context.Context, licensePlate string) (*Vehicle, error)
	Create(ctx context.Context, vehicle *Vehicle) (*Vehicle, error)
	Update(ctx context.Context, vehicle *Vehicle) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type VehicleGenesisJob struct {
	VehicleID uuid.UUID `json:"vehicleId"`
}

// Service handles business logic for vehicle management
type Service struct {
	repo      Repository
	publisher queue.Publisher
}

// NewService creates a new vehicle service
func NewService(repo Repository, publisher queue.Publisher) *Service {
	return &Service{repo, publisher}
}

// GetAll retrieves paginated vehicles with optional owner filter
func (s *Service) GetAll(ctx context.Context, limit, offset int, ownerID *uuid.UUID) ([]Vehicle, int, error) {
	return s.repo.GetAll(ctx, limit, offset, ownerID)
}

// GetAllWithStats retrieves paginated vehicles with event statistics
func (s *Service) GetAllWithStats(ctx context.Context, limit, offset int, ownerID *uuid.UUID) ([]VehicleWithStats, int, error) {
	return s.repo.GetAllWithStats(ctx, limit, offset, ownerID)
}

// GetByID retrieves a vehicle by its ID
func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Vehicle, error) {
	return s.repo.GetByID(ctx, id)
}

// GetByOwnerID retrieves all vehicles owned by a specific owner
func (s *Service) GetByOwnerID(ctx context.Context, ownerID uuid.UUID, limit, offset int) ([]Vehicle, int, error) {
	return s.repo.GetByOwnerID(ctx, ownerID, limit, offset)
}

// Create creates a new vehicle and optionally enqueues it for blockchain anchoring
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
		Fuel:               params.Fuel,
		EngineCc:           params.EngineCc,
		EngineCylinders:    params.EngineCylinders,
		EnginePowerHp:      params.EnginePowerHp,
		OwnerID:            params.OwnerID,
		BlockchainAssetID:  params.BlockchainAssetID,
		BlockchainStatus:   StatusNone,
	}

	created, err := s.repo.Create(ctx, vehicle)
	if err != nil {
		return nil, err
	}

	if params.ShouldAnchor {
		jobData, err := json.Marshal(VehicleGenesisJob{VehicleID: created.ID})
		if err != nil {
			return nil, fmt.Errorf("marshal anchor job: %w", err)
		}
		if err := s.publisher.Publish(ctx, SubjectVehicleGenesis, jobData); err != nil {
			return nil, fmt.Errorf("enqueue anchor job: %w", err)
		}
		created.BlockchainStatus = StatusPending
		if err := s.repo.Update(ctx, created); err != nil {
			return nil, fmt.Errorf("update blockchain status: %w", err)
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
	if params.Fuel != nil {
		vehicle.Fuel = params.Fuel
	}
	if params.EngineCc != nil {
		vehicle.EngineCc = params.EngineCc
	}
	if params.EngineCylinders != nil {
		vehicle.EngineCylinders = params.EngineCylinders
	}
	if params.EnginePowerHp != nil {
		vehicle.EnginePowerHp = params.EnginePowerHp
	}
	if params.OwnerID != nil {
		vehicle.OwnerID = params.OwnerID
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

// FindOrCreateVehicle searches for a vehicle by chassis number (priority) or license plate
// If not found, creates a new unclaimed vehicle with minimal information
func (s *Service) FindOrCreateVehicle(ctx context.Context, chassisNumber, licensePlate *string) (*Vehicle, error) {
	if chassisNumber != nil && *chassisNumber != "" {
		vehicle, err := s.repo.GetByChassisNumber(ctx, *chassisNumber)
		if err == nil {
			return vehicle, nil
		}
		if !errors.Is(err, ErrVehicleNotFound) {
			return nil, err
		}
	}

	if licensePlate != nil && *licensePlate != "" {
		vehicle, err := s.repo.GetByLicensePlate(ctx, *licensePlate)
		if err == nil {
			return vehicle, nil
		}
		if !errors.Is(err, ErrVehicleNotFound) {
			return nil, err
		}
	}

	newVehicle := &Vehicle{
		ID:               uuid.New(),
		LicensePlate:     licensePlate,
		ChassisNumber:    chassisNumber,
		Make:             "Unknown",
		Model:            "Unknown",
		Year:             0,
		OwnerID:          nil,
		BlockchainStatus: StatusNone,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	created, err := s.repo.Create(ctx, newVehicle)
	if err != nil {
		return nil, err
	}

	return created, nil
}

// AssignOwnership assigns ownership of a vehicle to a user
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
