package eventimages

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/s1moe2/classics-chain/pkg/storage"
)

type Storage interface {
	GeneratePresignedUploadURL(ctx context.Context, vehicleID, photoID uuid.UUID, bucket, fileType, fileExtension string) (objectKey string, uploadURL string, err error)
	DeleteObject(ctx context.Context, bucket, objectKey string) error
	GetObject(ctx context.Context, bucket, key string) ([]byte, error)
}

type CIDGenerator interface {
	GenerateFileCID(content []byte) (string, error)
}

type Service struct {
	repo         Repository
	storage      Storage
	cidGenerator CIDGenerator
}

func NewService(repo Repository, storage Storage, cidGenerator CIDGenerator) *Service {
	return &Service{
		repo:         repo,
		storage:      storage,
		cidGenerator: cidGenerator,
	}
}

func (s *Service) CreateUploadSession() uuid.UUID {
	return uuid.New()
}

func (s *Service) GenerateUploadURL(ctx context.Context, params GenerateUploadParams) (*EventImage, error) {
	count, err := s.repo.CountBySession(ctx, params.SessionID)
	if err != nil {
		return nil, err
	}

	if count >= MaxImagesPerEvent {
		return nil, ErrMaxImagesExceeded
	}

	imageID := uuid.New()
	objectKey, uploadURL, err := s.storage.GeneratePresignedUploadURL(
		ctx,
		params.SessionID,
		imageID,
		storage.VehiclesBucket,
		"event-images",
		params.FileExtension,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	image, err := s.repo.Create(ctx, CreateEventImageParams{
		UploadSessionID: params.SessionID,
		ObjectKey:       objectKey,
		UploadURL:       uploadURL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create event image record: %w", err)
	}

	return image, nil
}

func (s *Service) ConfirmUpload(ctx context.Context, imageID uuid.UUID) (*EventImage, error) {
	image, err := s.repo.Get(ctx, imageID)
	if err != nil {
		return nil, err
	}

	if image == nil {
		return nil, ErrEventImageNotFound
	}

	if image.CID != nil {
		return image, nil
	}

	content, err := s.storage.GetObject(ctx, storage.VehiclesBucket, image.ObjectKey)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch image from storage: %w", err)
	}

	cid, err := s.cidGenerator.GenerateFileCID(content)
	if err != nil {
		return nil, fmt.Errorf("failed to generate CID: %w", err)
	}

	confirmed, err := s.repo.ConfirmUpload(ctx, imageID, cid)
	if err != nil {
		return nil, fmt.Errorf("failed to confirm upload: %w", err)
	}

	return confirmed, nil
}

func (s *Service) ListBySession(ctx context.Context, sessionID uuid.UUID) ([]EventImage, error) {
	return s.repo.ListBySession(ctx, sessionID)
}

func (s *Service) ListByEvent(ctx context.Context, eventID uuid.UUID) ([]EventImage, error) {
	return s.repo.ListByEvent(ctx, eventID)
}

func (s *Service) AttachToEvent(ctx context.Context, sessionID, eventID uuid.UUID) error {
	return s.repo.AttachToEvent(ctx, sessionID, eventID)
}

func (s *Service) Delete(ctx context.Context, imageID uuid.UUID) error {
	image, err := s.repo.Get(ctx, imageID)
	if err != nil {
		return err
	}

	if image == nil {
		return nil
	}

	if image.EventID != nil {
		return ErrImageAlreadyAttached
	}

	if err := s.storage.DeleteObject(ctx, storage.VehiclesBucket, image.ObjectKey); err != nil {
		return fmt.Errorf("failed to delete object from storage: %w", err)
	}

	return s.repo.Delete(ctx, imageID)
}

func (s *Service) CountBySession(ctx context.Context, sessionID uuid.UUID) (int, error) {
	return s.repo.CountBySession(ctx, sessionID)
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*EventImage, error) {
	return s.repo.Get(ctx, id)
}

func (s *Service) ValidateSessionForEvent(ctx context.Context, sessionID uuid.UUID) ([]string, error) {
	images, err := s.repo.ListBySession(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	if len(images) == 0 {
		return nil, ErrSessionHasNoImages
	}

	if len(images) > MaxImagesPerEvent {
		return nil, ErrMaxImagesExceeded
	}

	var cids []string
	for _, img := range images {
		if img.CID == nil || img.UploadURL != nil {
			return nil, fmt.Errorf("%w: image %s", ErrImageNotConfirmed, img.ID)
		}
		cids = append(cids, *img.CID)
	}

	return cids, nil
}

func GetFileExtension(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		return ".jpg"
	}
	return ext
}
