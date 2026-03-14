package documents

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
	getFunc            func(ctx context.Context, id uuid.UUID) (*Document, error)
	createFunc         func(ctx context.Context, params CreateDocumentParams) (*Document, error)
	deleteFunc         func(ctx context.Context, id uuid.UUID) error
	countByVehicleFunc func(ctx context.Context, vehicleID uuid.UUID) (int, error)
	confirmUploadFunc  func(ctx context.Context, id uuid.UUID) (*Document, error)
}

func (m *mockRepo) ListByVehicle(ctx context.Context, vehicleID uuid.UUID) ([]Document, error) {
	return nil, nil
}
func (m *mockRepo) Get(ctx context.Context, id uuid.UUID) (*Document, error) {
	if m.getFunc != nil {
		return m.getFunc(ctx, id)
	}
	return nil, nil
}
func (m *mockRepo) GetByKey(ctx context.Context, vehicleID uuid.UUID, objectKey string) (*Document, error) {
	return nil, nil
}
func (m *mockRepo) Create(ctx context.Context, params CreateDocumentParams) (*Document, error) {
	if m.createFunc != nil {
		return m.createFunc(ctx, params)
	}
	return &Document{ID: uuid.New(), ObjectKey: params.ObjectKey, Filename: params.Filename}, nil
}
func (m *mockRepo) ConfirmUpload(ctx context.Context, id uuid.UUID) (*Document, error) {
	if m.confirmUploadFunc != nil {
		return m.confirmUploadFunc(ctx, id)
	}
	return &Document{ID: id}, nil
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
	generateURLFunc  func(ctx context.Context, vehicleID, documentID uuid.UUID, bucket, fileType, fileExtension string) (string, string, error)
	deleteObjectFunc func(ctx context.Context, bucket, objectKey string) error
}

func (m *mockStorage) GeneratePresignedUploadURL(ctx context.Context, vehicleID, documentID uuid.UUID, bucket, fileType, fileExtension string) (string, string, error) {
	if m.generateURLFunc != nil {
		return m.generateURLFunc(ctx, vehicleID, documentID, bucket, fileType, fileExtension)
	}
	return "doc-key", "https://upload.url", nil
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
		Filename:      "registration.pdf",
		FileExtension: ".pdf",
	})

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "registration.pdf", result.Filename)
}

func TestService_GenerateUploadURL_PDFOnly(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockStorage{})

	tests := []struct {
		ext     string
		wantErr bool
	}{
		{".pdf", false},
		{".PDF", false},
		{".jpg", true},
		{".doc", true},
		{".png", true},
	}

	for _, tt := range tests {
		t.Run(tt.ext, func(t *testing.T) {
			_, err := svc.GenerateUploadURL(context.Background(), GenerateUploadParams{
				VehicleID:     uuid.New(),
				Filename:      "test" + tt.ext,
				FileExtension: tt.ext,
			})
			if tt.wantErr {
				assert.ErrorIs(t, err, ErrInvalidFileExtension)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestService_GenerateUploadURL_MaxCount(t *testing.T) {
	repo := &mockRepo{
		countByVehicleFunc: func(_ context.Context, _ uuid.UUID) (int, error) {
			return MaxDocumentsPerVehicle, nil
		},
	}
	svc := NewService(repo, &mockStorage{})

	_, err := svc.GenerateUploadURL(context.Background(), GenerateUploadParams{
		VehicleID:     uuid.New(),
		Filename:      "doc.pdf",
		FileExtension: ".pdf",
	})
	assert.ErrorIs(t, err, ErrMaxDocumentsExceeded)
}

func TestService_GenerateUploadURL_FilenameStripsPath(t *testing.T) {
	var createdFilename string
	repo := &mockRepo{
		createFunc: func(_ context.Context, params CreateDocumentParams) (*Document, error) {
			createdFilename = params.Filename
			return &Document{ID: uuid.New(), Filename: params.Filename}, nil
		},
	}
	svc := NewService(repo, &mockStorage{})

	_, err := svc.GenerateUploadURL(context.Background(), GenerateUploadParams{
		VehicleID:     uuid.New(),
		Filename:      "/path/to/registration.pdf",
		FileExtension: ".pdf",
	})

	require.NoError(t, err)
	assert.Equal(t, "registration.pdf", createdFilename)
}

func TestService_DeleteDocument_Success(t *testing.T) {
	deletedFromStorage := false
	deletedFromRepo := false

	repo := &mockRepo{
		getFunc: func(_ context.Context, _ uuid.UUID) (*Document, error) {
			return &Document{ID: uuid.New(), ObjectKey: "doc-key"}, nil
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

	err := svc.DeleteDocument(context.Background(), uuid.New())
	require.NoError(t, err)
	assert.True(t, deletedFromStorage)
	assert.True(t, deletedFromRepo)
}

func TestService_DeleteDocument_NilDocument(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockStorage{})
	err := svc.DeleteDocument(context.Background(), uuid.New())
	assert.NoError(t, err)
}

func TestService_DeleteDocument_StorageError(t *testing.T) {
	repo := &mockRepo{
		getFunc: func(_ context.Context, _ uuid.UUID) (*Document, error) {
			return &Document{ID: uuid.New(), ObjectKey: "key"}, nil
		},
	}
	storage := &mockStorage{
		deleteObjectFunc: func(_ context.Context, _, _ string) error {
			return errors.New("s3 error")
		},
	}
	svc := NewService(repo, storage)

	err := svc.DeleteDocument(context.Background(), uuid.New())
	assert.Error(t, err)
}
