package documents

import (
	"context"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/s1moe2/classics-chain/pkg/storage"
)

// Storage defines the interface for object storage operations
type Storage interface {
	GeneratePresignedUploadURL(ctx context.Context, vehicleID, documentID uuid.UUID, bucket, fileType, fileExtension string) (objectKey string, uploadURL string, err error)
	DeleteObject(ctx context.Context, bucket, objectKey string) error
}

// Service handles business logic for document management
type Service struct {
	repo    Repository
	storage Storage
}

// NewService creates a new document service
func NewService(repo Repository, storage Storage) *Service {
	return &Service{
		repo:    repo,
		storage: storage,
	}
}

// GetByVehicleID retrieves all documents for a vehicle
func (s *Service) GetByVehicleID(ctx context.Context, vehicleID uuid.UUID) ([]Document, error) {
	return s.repo.ListByVehicle(ctx, vehicleID)
}

// GetByID retrieves a document by its ID
func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Document, error) {
	return s.repo.Get(ctx, id)
}

// GenerateUploadURL generates a pre-signed URL and creates a pending document record
func (s *Service) GenerateUploadURL(ctx context.Context, params GenerateUploadParams) (*Document, error) {
	count, err := s.repo.CountByVehicle(ctx, params.VehicleID)
	if err != nil {
		return nil, err
	}

	if count >= MaxDocumentsPerVehicle {
		return nil, ErrMaxDocumentsExceeded
	}

	if !strings.EqualFold(params.FileExtension, ".pdf") {
		return nil, ErrInvalidFileExtension
	}

	documentID := uuid.New()
	objectKey, uploadURL, err := s.storage.GeneratePresignedUploadURL(ctx, params.VehicleID, documentID, storage.VehiclesBucket, "documents", params.FileExtension)
	if err != nil {
		return nil, err
	}

	document, err := s.repo.Create(ctx, CreateDocumentParams{
		VehicleID: params.VehicleID,
		ObjectKey: objectKey,
		Filename:  filepath.Base(params.Filename),
		UploadURL: uploadURL,
	})
	if err != nil {
		return nil, err
	}

	return document, nil
}

// ConfirmDocumentUpload confirms a successful document upload by nulling the upload_url
func (s *Service) ConfirmDocumentUpload(ctx context.Context, documentID uuid.UUID) (*Document, error) {
	document, err := s.repo.ConfirmUpload(ctx, documentID)
	if err != nil {
		return nil, err
	}

	return document, nil
}

// DeleteDocument deletes a document and its object from storage
func (s *Service) DeleteDocument(ctx context.Context, documentID uuid.UUID) error {
	document, err := s.repo.Get(ctx, documentID)
	if err != nil {
		return err
	}

	if document == nil {
		return nil
	}

	if err := s.storage.DeleteObject(ctx, storage.VehiclesBucket, document.ObjectKey); err != nil {
		return err
	}

	return s.repo.Delete(ctx, documentID)
}
