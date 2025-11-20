package photos

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

// Domain errors
var (
	ErrPhotoNotFound     = errors.New("photo not found")
	ErrMaxPhotosExceeded = errors.New("vehicle has reached maximum number of photos (10)")
	ErrInvalidPhotoData  = errors.New("invalid photo data")
)

// Photo represents a vehicle photo in the system
type Photo struct {
	ID        uuid.UUID `json:"id"`
	VehicleID uuid.UUID `json:"vehicleId"`
	ObjectKey string    `json:"objectKey"`
	UploadURL *string   `json:"uploadUrl,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

// CreatePhotoParams represents parameters for creating a new photo with upload URL
type CreatePhotoParams struct {
	VehicleID uuid.UUID
	ObjectKey string
	UploadURL string
}

// GenerateUploadParams represents parameters for generating an upload URL
type GenerateUploadParams struct {
	VehicleID     uuid.UUID
	Filename      string
	FileExtension string
}

// Repository defines the interface for photo data access
type Repository interface {
	ListByVehicle(ctx context.Context, vehicleID uuid.UUID) ([]Photo, error)
	Get(ctx context.Context, id uuid.UUID) (*Photo, error)
	Create(ctx context.Context, params CreatePhotoParams) (*Photo, error)
	ConfirmUpload(ctx context.Context, id uuid.UUID) (*Photo, error)
	Delete(ctx context.Context, id uuid.UUID) error
	CountByVehicle(ctx context.Context, vehicleID uuid.UUID) (int, error)
}
