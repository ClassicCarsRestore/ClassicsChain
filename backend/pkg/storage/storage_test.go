package storage

import (
	"context"
	"errors"
	"testing"

	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

// Mock implementations for testing

type mockDocumentOps struct {
	deleteObjectFunc func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
}

func (m *mockDocumentOps) DeleteObject(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
	if m.deleteObjectFunc != nil {
		return m.deleteObjectFunc(ctx, params, optFns...)
	}
	return &s3.DeleteObjectOutput{}, nil
}

type mockPresigner struct {
	presignPutObjectFunc func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error)
}

func (m *mockPresigner) PresignPutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error) {
	if m.presignPutObjectFunc != nil {
		return m.presignPutObjectFunc(ctx, params, optFns...)
	}
	return &v4.PresignedHTTPRequest{
		URL: "https://example.com/presigned-url",
	}, nil
}

// Tests

func TestNew(t *testing.T) {
	tests := []struct {
		name   string
		config Config
	}{
		{
			name: "creates storage with http",
			config: Config{
				Endpoint:  "localhost:3900",
				AccessKey: "test-access-key",
				SecretKey: "test-secret-key",
				UseSSL:    false,
			},
		},
		{
			name: "creates storage with https",
			config: Config{
				Endpoint:  "garage.example.com",
				AccessKey: "test-access-key",
				SecretKey: "test-secret-key",
				UseSSL:    true,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			storage, err := New(tt.config)
			if err != nil {
				t.Fatalf("expected no error, got %v", err)
			}
			if storage == nil {
				t.Fatal("expected storage to be non-nil")
			}
			if storage.client == nil {
				t.Error("expected client to be non-nil")
			}
			if storage.presigner == nil {
				t.Error("expected presigner to be non-nil")
			}
		})
	}
}

func TestGarageStorage_GeneratePresignedUploadURL(t *testing.T) {
	vehicleID := uuid.New()
	photoID := uuid.New()

	tests := []struct {
		name          string
		vehicleID     uuid.UUID
		photoID       uuid.UUID
		bucketName    string
		fileType      string
		fileExtension string
		presigner     *mockPresigner
		wantErr       bool
		wantURL       string
	}{
		{
			name:          "successfully generates presigned URL",
			vehicleID:     vehicleID,
			photoID:       photoID,
			bucketName:    VehiclesBucket,
			fileType:      "photos",
			fileExtension: ".jpg",
			presigner: &mockPresigner{
				presignPutObjectFunc: func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error) {
					// Verify the parameters
					if params.Bucket == nil || *params.Bucket != VehiclesBucket {
						t.Errorf("expected bucket %s, got %v", VehiclesBucket, params.Bucket)
					}
					expectedKey := vehicleID.String() + "/photos/" + photoID.String() + ".jpg"
					if params.Key == nil || *params.Key != expectedKey {
						t.Errorf("expected key %s, got %v", expectedKey, params.Key)
					}
					return &v4.PresignedHTTPRequest{
						URL: "https://example.com/presigned-url?signature=xyz",
					}, nil
				},
			},
			wantErr: false,
			wantURL: "https://example.com/presigned-url?signature=xyz",
		},
		{
			name:          "handles presigner error",
			vehicleID:     vehicleID,
			photoID:       photoID,
			bucketName:    VehiclesBucket,
			fileType:      "documents",
			fileExtension: ".pdf",
			presigner: &mockPresigner{
				presignPutObjectFunc: func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error) {
					return nil, errors.New("presigner error")
				},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			storage := &GarageStorage{
				client:    &mockDocumentOps{},
				presigner: tt.presigner,
			}

			objectKey, uploadURL, err := storage.GeneratePresignedUploadURL(
				context.Background(),
				tt.vehicleID,
				tt.photoID,
				tt.bucketName,
				tt.fileType,
				tt.fileExtension,
			)

			if (err != nil) != tt.wantErr {
				t.Fatalf("expected error: %v, got: %v", tt.wantErr, err)
			}

			if tt.wantErr {
				return
			}

			if uploadURL != tt.wantURL {
				t.Errorf("expected URL %s, got %s", tt.wantURL, uploadURL)
			}

			expectedObjectKey := tt.vehicleID.String() + "/" + tt.fileType + "/" + tt.photoID.String() + tt.fileExtension
			if objectKey != expectedObjectKey {
				t.Errorf("expected object key %s, got %s", expectedObjectKey, objectKey)
			}
		})
	}
}

func TestGarageStorage_DeleteObject(t *testing.T) {
	testBucket := VehiclesBucket
	testKey := "test-vehicle-id/photos/test-photo-id.jpg"

	tests := []struct {
		name      string
		bucket    string
		objectKey string
		client    *mockDocumentOps
		wantErr   bool
	}{
		{
			name:      "successfully deletes object",
			bucket:    testBucket,
			objectKey: testKey,
			client: &mockDocumentOps{
				deleteObjectFunc: func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
					// Verify the parameters
					if params.Bucket == nil || *params.Bucket != testBucket {
						t.Errorf("expected bucket %s, got %v", testBucket, params.Bucket)
					}
					if params.Key == nil || *params.Key != testKey {
						t.Errorf("expected key %s, got %v", testKey, params.Key)
					}
					return &s3.DeleteObjectOutput{}, nil
				},
			},
			wantErr: false,
		},
		{
			name:      "handles delete error",
			bucket:    testBucket,
			objectKey: testKey,
			client: &mockDocumentOps{
				deleteObjectFunc: func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
					return nil, errors.New("delete failed")
				},
			},
			wantErr: true,
		},
		{
			name:      "handles non-existent object",
			bucket:    testBucket,
			objectKey: "non-existent-key",
			client: &mockDocumentOps{
				deleteObjectFunc: func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
					return &s3.DeleteObjectOutput{}, nil // S3 returns success even if object doesn't exist
				},
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			storage := &GarageStorage{
				client:    tt.client,
				presigner: &mockPresigner{},
			}

			err := storage.DeleteObject(context.Background(), tt.bucket, tt.objectKey)

			if (err != nil) != tt.wantErr {
				t.Fatalf("expected error: %v, got: %v", tt.wantErr, err)
			}
		})
	}
}

func TestGarageStorage_GeneratePresignedUploadURL_ObjectKeyFormat(t *testing.T) {
	// Test to verify the object key format is correct
	vehicleID := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
	photoID := uuid.MustParse("6ba7b810-9dad-11d1-80b4-00c04fd430c8")

	storage := &GarageStorage{
		client: &mockDocumentOps{},
		presigner: &mockPresigner{
			presignPutObjectFunc: func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error) {
				return &v4.PresignedHTTPRequest{URL: "https://example.com/url"}, nil
			},
		},
	}

	tests := []struct {
		name          string
		fileType      string
		fileExtension string
		expectedKey   string
	}{
		{
			name:          "photo with jpg extension",
			fileType:      "photos",
			fileExtension: ".jpg",
			expectedKey:   "550e8400-e29b-41d4-a716-446655440000/photos/6ba7b810-9dad-11d1-80b4-00c04fd430c8.jpg",
		},
		{
			name:          "document with pdf extension",
			fileType:      "documents",
			fileExtension: ".pdf",
			expectedKey:   "550e8400-e29b-41d4-a716-446655440000/documents/6ba7b810-9dad-11d1-80b4-00c04fd430c8.pdf",
		},
		{
			name:          "photo with png extension",
			fileType:      "photos",
			fileExtension: ".png",
			expectedKey:   "550e8400-e29b-41d4-a716-446655440000/photos/6ba7b810-9dad-11d1-80b4-00c04fd430c8.png",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			objectKey, _, err := storage.GeneratePresignedUploadURL(
				context.Background(),
				vehicleID,
				photoID,
				VehiclesBucket,
				tt.fileType,
				tt.fileExtension,
			)

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if objectKey != tt.expectedKey {
				t.Errorf("expected object key %s, got %s", tt.expectedKey, objectKey)
			}
		})
	}
}

func TestGarageStorage_WithNilContext(t *testing.T) {
	storage := &GarageStorage{
		client: &mockDocumentOps{
			deleteObjectFunc: func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
				if ctx == nil {
					t.Error("expected non-nil context")
				}
				return &s3.DeleteObjectOutput{}, nil
			},
		},
		presigner: &mockPresigner{
			presignPutObjectFunc: func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error) {
				if ctx == nil {
					t.Error("expected non-nil context")
				}
				return &v4.PresignedHTTPRequest{URL: "https://example.com/url"}, nil
			},
		},
	}

	ctx := context.Background()

	// Test DeleteObject with context
	err := storage.DeleteObject(ctx, VehiclesBucket, "test-key")
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	// Test GeneratePresignedUploadURL with context
	_, _, err = storage.GeneratePresignedUploadURL(
		ctx,
		uuid.New(),
		uuid.New(),
		VehiclesBucket,
		"photos",
		".jpg",
	)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestConstants(t *testing.T) {
	if VehiclesBucket != "vehicles" {
		t.Errorf("expected VehiclesBucket to be 'vehicles', got %s", VehiclesBucket)
	}

	if presignedURLExpiry != 5*60*1000000000 { // 5 minutes in nanoseconds
		t.Errorf("expected presignedURLExpiry to be 5 minutes, got %v", presignedURLExpiry)
	}
}
