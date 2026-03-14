package photos

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// --- Mocks ---

type mockRepo struct {
	getFunc            func(ctx context.Context, id uuid.UUID) (*Photo, error)
	createFunc         func(ctx context.Context, params CreatePhotoParams) (*Photo, error)
	deleteFunc         func(ctx context.Context, id uuid.UUID) error
	countByVehicleFunc func(ctx context.Context, vehicleID uuid.UUID) (int, error)
	confirmUploadFunc  func(ctx context.Context, id uuid.UUID) (*Photo, error)
}

func (m *mockRepo) ListByVehicle(ctx context.Context, vehicleID uuid.UUID) ([]Photo, error) {
	return nil, nil
}
func (m *mockRepo) Get(ctx context.Context, id uuid.UUID) (*Photo, error) {
	if m.getFunc != nil {
		return m.getFunc(ctx, id)
	}
	return nil, nil
}
func (m *mockRepo) Create(ctx context.Context, params CreatePhotoParams) (*Photo, error) {
	if m.createFunc != nil {
		return m.createFunc(ctx, params)
	}
	return &Photo{ID: uuid.New(), ObjectKey: params.ObjectKey}, nil
}
func (m *mockRepo) ConfirmUpload(ctx context.Context, id uuid.UUID) (*Photo, error) {
	if m.confirmUploadFunc != nil {
		return m.confirmUploadFunc(ctx, id)
	}
	return &Photo{ID: id}, nil
}
func (m *mockRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteFunc != nil {
		return m.deleteFunc(ctx, id)
	}
	return nil
}
func (m *mockRepo) CountByVehicle(ctx context.Context, vehicleID uuid.UUID) (int, error) {
	if m.countByVehicleFunc != nil {
		return m.countByVehicleFunc(ctx, vehicleID)
	}
	return 0, nil
}

type mockStorage struct {
	generateURLFunc  func(ctx context.Context, vehicleID, photoID uuid.UUID, bucket, fileType, fileExtension string) (string, string, error)
	deleteObjectFunc func(ctx context.Context, bucket, objectKey string) error
}

func (m *mockStorage) GeneratePresignedUploadURL(ctx context.Context, vehicleID, photoID uuid.UUID, bucket, fileType, fileExtension string) (string, string, error) {
	if m.generateURLFunc != nil {
		return m.generateURLFunc(ctx, vehicleID, photoID, bucket, fileType, fileExtension)
	}
	return "photo-key", "https://upload.url", nil
}
func (m *mockStorage) DeleteObject(ctx context.Context, bucket, objectKey string) error {
	if m.deleteObjectFunc != nil {
		return m.deleteObjectFunc(ctx, bucket, objectKey)
	}
	return nil
}

// --- Tests ---

func TestService_GenerateUploadURL_Success(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockStorage{})

	result, err := svc.GenerateUploadURL(context.Background(), GenerateUploadParams{
		VehicleID:     uuid.New(),
		FileExtension: ".jpg",
	})

	require.NoError(t, err)
	assert.NotNil(t, result)
}

func TestService_GenerateUploadURL_MaxCount(t *testing.T) {
	repo := &mockRepo{
		countByVehicleFunc: func(_ context.Context, _ uuid.UUID) (int, error) {
			return 10, nil
		},
	}
	svc := NewService(repo, &mockStorage{})

	_, err := svc.GenerateUploadURL(context.Background(), GenerateUploadParams{
		VehicleID:     uuid.New(),
		FileExtension: ".jpg",
	})
	assert.ErrorIs(t, err, ErrMaxPhotosExceeded)
}

func TestService_GenerateUploadURL_StorageError(t *testing.T) {
	storage := &mockStorage{
		generateURLFunc: func(_ context.Context, _, _ uuid.UUID, _, _, _ string) (string, string, error) {
			return "", "", errors.New("s3 error")
		},
	}
	svc := NewService(&mockRepo{}, storage)

	_, err := svc.GenerateUploadURL(context.Background(), GenerateUploadParams{
		VehicleID:     uuid.New(),
		FileExtension: ".jpg",
	})
	assert.Error(t, err)
}

func TestService_DeletePhoto_Success(t *testing.T) {
	deletedFromStorage := false
	deletedFromRepo := false

	repo := &mockRepo{
		getFunc: func(_ context.Context, _ uuid.UUID) (*Photo, error) {
			return &Photo{ID: uuid.New(), ObjectKey: "photo-key"}, nil
		},
		deleteFunc: func(_ context.Context, _ uuid.UUID) error {
			deletedFromRepo = true
			return nil
		},
	}
	storage := &mockStorage{
		deleteObjectFunc: func(_ context.Context, _, _ string) error {
			deletedFromStorage = true
			return nil
		},
	}
	svc := NewService(repo, storage)

	err := svc.DeletePhoto(context.Background(), uuid.New())
	require.NoError(t, err)
	assert.True(t, deletedFromStorage)
	assert.True(t, deletedFromRepo)
}

func TestService_DeletePhoto_NilPhoto(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockStorage{})
	err := svc.DeletePhoto(context.Background(), uuid.New())
	assert.NoError(t, err)
}

func TestService_DeletePhoto_StorageError(t *testing.T) {
	repo := &mockRepo{
		getFunc: func(_ context.Context, _ uuid.UUID) (*Photo, error) {
			return &Photo{ID: uuid.New(), ObjectKey: "key"}, nil
		},
	}
	storage := &mockStorage{
		deleteObjectFunc: func(_ context.Context, _, _ string) error {
			return errors.New("s3 error")
		},
	}
	svc := NewService(repo, storage)

	err := svc.DeletePhoto(context.Background(), uuid.New())
	assert.Error(t, err)
}
