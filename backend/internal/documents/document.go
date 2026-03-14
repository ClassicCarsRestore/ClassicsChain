package documents

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

// Domain errors
var (
	ErrDocumentNotFound      = errors.New("document not found")
	ErrMaxDocumentsExceeded  = errors.New("vehicle has reached maximum number of documents (20)")
	ErrInvalidDocumentData   = errors.New("invalid document data")
	ErrInvalidFileExtension  = errors.New("only PDF files are allowed")
)

// Document represents a vehicle document in the system
type Document struct {
	ID        uuid.UUID `json:"id"`
	VehicleID uuid.UUID `json:"vehicleId"`
	ObjectKey string    `json:"objectKey"`
	Filename  string    `json:"filename"`
	UploadURL *string   `json:"uploadUrl,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

// CreateDocumentParams represents parameters for creating a new document with upload URL
type CreateDocumentParams struct {
	VehicleID uuid.UUID
	ObjectKey string
	Filename  string
	UploadURL string
}

// GenerateUploadParams represents parameters for generating an upload URL
type GenerateUploadParams struct {
	VehicleID     uuid.UUID
	Filename      string
	FileExtension string
}

// Repository defines the interface for document data access
type Repository interface {
	ListByVehicle(ctx context.Context, vehicleID uuid.UUID) ([]Document, error)
	Get(ctx context.Context, id uuid.UUID) (*Document, error)
	GetByKey(ctx context.Context, vehicleID uuid.UUID, objectKey string) (*Document, error)
	Create(ctx context.Context, params CreateDocumentParams) (*Document, error)
	ConfirmUpload(ctx context.Context, id uuid.UUID) (*Document, error)
	Delete(ctx context.Context, id uuid.UUID) error
	CountByVehicle(ctx context.Context, vehicleID uuid.UUID) (int, error)
}

const MaxDocumentsPerVehicle = 20
