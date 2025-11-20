package photos

import (
	"context"

	"github.com/google/uuid"
	"github.com/s1moe2/classics-chain/pkg/storage"
)

// Storage defines the interface for object storage operations
type Storage interface {
	GeneratePresignedUploadURL(ctx context.Context, vehicleID, photoID uuid.UUID, bucket, fileType, fileExtension string) (objectKey string, uploadURL string, err error)
	DeleteObject(ctx context.Context, bucket, objectKey string) error
}

// Service handles business logic for photo management
type Service struct {
	repo    Repository
	storage Storage
}

// NewService creates a new photo service
func NewService(repo Repository, storage Storage) *Service {
	return &Service{
		repo:    repo,
		storage: storage,
	}
}

// GetByVehicleID retrieves all photos for a vehicle
func (s *Service) GetByVehicleID(ctx context.Context, vehicleID uuid.UUID) ([]Photo, error) {
	return s.repo.ListByVehicle(ctx, vehicleID)
}

// GetByID retrieves a photo by its ID
func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Photo, error) {
	return s.repo.Get(ctx, id)
}

// GenerateUploadURL generates a pre-signed URL and creates a pending photo record
func (s *Service) GenerateUploadURL(ctx context.Context, params GenerateUploadParams) (*Photo, error) {
	count, err := s.repo.CountByVehicle(ctx, params.VehicleID)
	if err != nil {
		return nil, err
	}

	if count >= 10 {
		return nil, ErrMaxPhotosExceeded
	}

	photoID := uuid.New()
	objectKey, uploadURL, err := s.storage.GeneratePresignedUploadURL(ctx, params.VehicleID, photoID, storage.VehiclesBucket, "photos", params.FileExtension)
	if err != nil {
		return nil, err
	}

	photo, err := s.repo.Create(ctx, CreatePhotoParams{
		VehicleID: params.VehicleID,
		ObjectKey: objectKey,
		UploadURL: uploadURL,
	})
	if err != nil {
		return nil, err
	}

	return photo, nil
}

// ConfirmPhotoUpload confirms a successful photo upload by nulling the upload_url
func (s *Service) ConfirmPhotoUpload(ctx context.Context, photoID uuid.UUID) (*Photo, error) {
	photo, err := s.repo.ConfirmUpload(ctx, photoID)
	if err != nil {
		return nil, err
	}

	return photo, nil
}

// DeletePhoto deletes a photo and its object from storage
func (s *Service) DeletePhoto(ctx context.Context, photoID uuid.UUID) error {
	photo, err := s.repo.Get(ctx, photoID)
	if err != nil {
		return err
	}

	if photo == nil {
		return nil
	}

	if err := s.storage.DeleteObject(ctx, storage.VehiclesBucket, photo.ObjectKey); err != nil {
		return err
	}

	return s.repo.Delete(ctx, photoID)
}
