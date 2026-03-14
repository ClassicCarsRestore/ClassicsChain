package eventimages

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
	createFunc         func(ctx context.Context, params CreateEventImageParams) (*EventImage, error)
	getFunc            func(ctx context.Context, id uuid.UUID) (*EventImage, error)
	listBySessionFunc  func(ctx context.Context, sessionID uuid.UUID) ([]EventImage, error)
	confirmUploadFunc  func(ctx context.Context, id uuid.UUID, cid string) (*EventImage, error)
	deleteFunc         func(ctx context.Context, id uuid.UUID) error
	countBySessionFunc func(ctx context.Context, sessionID uuid.UUID) (int, error)
}

func (m *mockRepo) Create(ctx context.Context, params CreateEventImageParams) (*EventImage, error) {
	if m.createFunc != nil {
		return m.createFunc(ctx, params)
	}
	return &EventImage{ID: uuid.New(), ObjectKey: params.ObjectKey}, nil
}
func (m *mockRepo) Get(ctx context.Context, id uuid.UUID) (*EventImage, error) {
	if m.getFunc != nil {
		return m.getFunc(ctx, id)
	}
	return nil, nil
}
func (m *mockRepo) ListBySession(ctx context.Context, sessionID uuid.UUID) ([]EventImage, error) {
	if m.listBySessionFunc != nil {
		return m.listBySessionFunc(ctx, sessionID)
	}
	return nil, nil
}
func (m *mockRepo) ListByEvent(ctx context.Context, eventID uuid.UUID) ([]EventImage, error) {
	return nil, nil
}
func (m *mockRepo) ConfirmUpload(ctx context.Context, id uuid.UUID, cid string) (*EventImage, error) {
	if m.confirmUploadFunc != nil {
		return m.confirmUploadFunc(ctx, id, cid)
	}
	return &EventImage{ID: id, CID: &cid}, nil
}
func (m *mockRepo) AttachToEvent(ctx context.Context, sessionID, eventID uuid.UUID) error {
	return nil
}
func (m *mockRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteFunc != nil {
		return m.deleteFunc(ctx, id)
	}
	return nil
}
func (m *mockRepo) CountBySession(ctx context.Context, sessionID uuid.UUID) (int, error) {
	if m.countBySessionFunc != nil {
		return m.countBySessionFunc(ctx, sessionID)
	}
	return 0, nil
}

type mockStorage struct {
	generateURLFunc  func(ctx context.Context, vehicleID, photoID uuid.UUID, bucket, fileType, fileExtension string) (string, string, error)
	deleteObjectFunc func(ctx context.Context, bucket, objectKey string) error
	getObjectFunc    func(ctx context.Context, bucket, key string) ([]byte, error)
}

func (m *mockStorage) GeneratePresignedUploadURL(ctx context.Context, vehicleID, photoID uuid.UUID, bucket, fileType, fileExtension string) (string, string, error) {
	if m.generateURLFunc != nil {
		return m.generateURLFunc(ctx, vehicleID, photoID, bucket, fileType, fileExtension)
	}
	return "obj-key", "https://upload.url", nil
}
func (m *mockStorage) DeleteObject(ctx context.Context, bucket, objectKey string) error {
	if m.deleteObjectFunc != nil {
		return m.deleteObjectFunc(ctx, bucket, objectKey)
	}
	return nil
}
func (m *mockStorage) GetObject(ctx context.Context, bucket, key string) ([]byte, error) {
	if m.getObjectFunc != nil {
		return m.getObjectFunc(ctx, bucket, key)
	}
	return []byte("image-data"), nil
}

type mockCIDGenerator struct {
	generateFunc func(content []byte) (string, error)
}

func (m *mockCIDGenerator) GenerateFileCID(content []byte) (string, error) {
	if m.generateFunc != nil {
		return m.generateFunc(content)
	}
	return "bafkreitest", nil
}

// --- Tests ---

func ptr[T any](v T) *T { return &v }

func TestService_GenerateUploadURL_Success(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockStorage{}, &mockCIDGenerator{})

	result, err := svc.GenerateUploadURL(context.Background(), GenerateUploadParams{
		SessionID:     uuid.New(),
		FileExtension: ".jpg",
	})

	require.NoError(t, err)
	assert.NotNil(t, result)
}

func TestService_GenerateUploadURL_MaxLimit(t *testing.T) {
	repo := &mockRepo{
		countBySessionFunc: func(_ context.Context, _ uuid.UUID) (int, error) {
			return MaxImagesPerEvent, nil
		},
	}
	svc := NewService(repo, &mockStorage{}, &mockCIDGenerator{})

	_, err := svc.GenerateUploadURL(context.Background(), GenerateUploadParams{
		SessionID:     uuid.New(),
		FileExtension: ".jpg",
	})
	assert.ErrorIs(t, err, ErrMaxImagesExceeded)
}

func TestService_ConfirmUpload_Success(t *testing.T) {
	imageID := uuid.New()
	repo := &mockRepo{
		getFunc: func(_ context.Context, _ uuid.UUID) (*EventImage, error) {
			return &EventImage{ID: imageID, ObjectKey: "test-key", CID: nil}, nil
		},
	}
	svc := NewService(repo, &mockStorage{}, &mockCIDGenerator{})

	result, err := svc.ConfirmUpload(context.Background(), imageID)
	require.NoError(t, err)
	assert.NotNil(t, result.CID)
}

func TestService_ConfirmUpload_AlreadyConfirmed(t *testing.T) {
	imageID := uuid.New()
	cid := "bafkreiexisting"
	repo := &mockRepo{
		getFunc: func(_ context.Context, _ uuid.UUID) (*EventImage, error) {
			return &EventImage{ID: imageID, CID: &cid}, nil
		},
	}
	svc := NewService(repo, &mockStorage{}, &mockCIDGenerator{})

	result, err := svc.ConfirmUpload(context.Background(), imageID)
	require.NoError(t, err)
	assert.Equal(t, &cid, result.CID)
}

func TestService_ConfirmUpload_NotFound(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockStorage{}, &mockCIDGenerator{})

	_, err := svc.ConfirmUpload(context.Background(), uuid.New())
	assert.ErrorIs(t, err, ErrEventImageNotFound)
}

func TestService_Delete_AttachedImage(t *testing.T) {
	eventID := uuid.New()
	repo := &mockRepo{
		getFunc: func(_ context.Context, _ uuid.UUID) (*EventImage, error) {
			return &EventImage{ID: uuid.New(), EventID: &eventID}, nil
		},
	}
	svc := NewService(repo, &mockStorage{}, &mockCIDGenerator{})

	err := svc.Delete(context.Background(), uuid.New())
	assert.ErrorIs(t, err, ErrImageAlreadyAttached)
}

func TestService_Delete_UnattachedImage(t *testing.T) {
	deletedFromStorage := false
	deletedFromRepo := false

	repo := &mockRepo{
		getFunc: func(_ context.Context, _ uuid.UUID) (*EventImage, error) {
			return &EventImage{ID: uuid.New(), ObjectKey: "key", EventID: nil}, nil
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
	svc := NewService(repo, storage, &mockCIDGenerator{})

	err := svc.Delete(context.Background(), uuid.New())
	require.NoError(t, err)
	assert.True(t, deletedFromStorage)
	assert.True(t, deletedFromRepo)
}

func TestService_Delete_NilImage(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockStorage{}, &mockCIDGenerator{})
	err := svc.Delete(context.Background(), uuid.New())
	assert.NoError(t, err)
}

func TestService_ValidateSessionForEvent_NoImages(t *testing.T) {
	repo := &mockRepo{
		listBySessionFunc: func(_ context.Context, _ uuid.UUID) ([]EventImage, error) {
			return nil, nil
		},
	}
	svc := NewService(repo, &mockStorage{}, &mockCIDGenerator{})

	_, err := svc.ValidateSessionForEvent(context.Background(), uuid.New())
	assert.ErrorIs(t, err, ErrSessionHasNoImages)
}

func TestService_ValidateSessionForEvent_TooMany(t *testing.T) {
	images := make([]EventImage, MaxImagesPerEvent+1)
	for i := range images {
		images[i] = EventImage{ID: uuid.New(), CID: ptr("cid")}
	}

	repo := &mockRepo{
		listBySessionFunc: func(_ context.Context, _ uuid.UUID) ([]EventImage, error) {
			return images, nil
		},
	}
	svc := NewService(repo, &mockStorage{}, &mockCIDGenerator{})

	_, err := svc.ValidateSessionForEvent(context.Background(), uuid.New())
	assert.ErrorIs(t, err, ErrMaxImagesExceeded)
}

func TestService_ValidateSessionForEvent_UnconfirmedImages(t *testing.T) {
	repo := &mockRepo{
		listBySessionFunc: func(_ context.Context, _ uuid.UUID) ([]EventImage, error) {
			return []EventImage{
				{ID: uuid.New(), CID: nil, UploadURL: ptr("pending")},
			}, nil
		},
	}
	svc := NewService(repo, &mockStorage{}, &mockCIDGenerator{})

	_, err := svc.ValidateSessionForEvent(context.Background(), uuid.New())
	assert.ErrorIs(t, err, ErrImageNotConfirmed)
}

func TestService_ValidateSessionForEvent_Success(t *testing.T) {
	repo := &mockRepo{
		listBySessionFunc: func(_ context.Context, _ uuid.UUID) ([]EventImage, error) {
			return []EventImage{
				{ID: uuid.New(), CID: ptr("cid1"), UploadURL: nil},
				{ID: uuid.New(), CID: ptr("cid2"), UploadURL: nil},
			}, nil
		},
	}
	svc := NewService(repo, &mockStorage{}, &mockCIDGenerator{})

	cids, err := svc.ValidateSessionForEvent(context.Background(), uuid.New())
	require.NoError(t, err)
	assert.Equal(t, []string{"cid1", "cid2"}, cids)
}

func TestGetFileExtension(t *testing.T) {
	tests := []struct {
		filename string
		want     string
	}{
		{"photo.jpg", ".jpg"},
		{"photo.PNG", ".png"},
		{"photo.JPEG", ".jpeg"},
		{"noextension", ".jpg"},
		{"", ".jpg"},
		{"path/to/file.webp", ".webp"},
	}

	for _, tt := range tests {
		t.Run(tt.filename, func(t *testing.T) {
			assert.Equal(t, tt.want, GetFileExtension(tt.filename))
		})
	}
}

func TestService_ConfirmUpload_StorageError(t *testing.T) {
	repo := &mockRepo{
		getFunc: func(_ context.Context, _ uuid.UUID) (*EventImage, error) {
			return &EventImage{ID: uuid.New(), ObjectKey: "key", CID: nil}, nil
		},
	}
	storage := &mockStorage{
		getObjectFunc: func(_ context.Context, _, _ string) ([]byte, error) {
			return nil, errors.New("s3 error")
		},
	}
	svc := NewService(repo, storage, &mockCIDGenerator{})

	_, err := svc.ConfirmUpload(context.Background(), uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "fetch image from storage")
}
