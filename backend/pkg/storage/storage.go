package storage

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

const (
	VehiclesBucket     = "vehicles"
	presignedURLExpiry = 5 * time.Minute
)

type DocumentOps interface {
	DeleteObject(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
}

type Presigner interface {
	PresignPutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error)
}

// GarageStorage implements the Storage interface using Garage (S3-compatible)
type GarageStorage struct {
	client    DocumentOps
	presigner Presigner
}

type Config struct {
	Endpoint       string
	PublicEndpoint string
	AccessKey      string
	SecretKey      string
	UseSSL         bool
	PublicBuckets  []string
}

// New creates a new Garage storage client
func New(cfg Config) (*GarageStorage, error) {
	// Build internal endpoint for backend to connect to
	var endpoint string
	if strings.HasPrefix(cfg.Endpoint, "http://") || strings.HasPrefix(cfg.Endpoint, "https://") {
		endpoint = cfg.Endpoint
	} else {
		scheme := "http"
		if cfg.UseSSL {
			scheme = "https"
		}
		endpoint = fmt.Sprintf("%s://%s", scheme, cfg.Endpoint)
	}

	credentialsProvider := credentials.NewStaticCredentialsProvider(
		cfg.AccessKey,
		cfg.SecretKey,
		"",
	)

	client := s3.New(s3.Options{
		Credentials:  credentialsProvider,
		BaseEndpoint: &endpoint,
		Region:       "garage",
		UsePathStyle: true,
	})

	// For presigned URLs, we need to use the public endpoint (if specified) to generate
	// signatures with the correct host. The signature includes the hostname, so we must
	// generate with the same host that will receive the request.
	var presignEndpoint string
	if cfg.PublicEndpoint != "" {
		presignEndpoint = cfg.PublicEndpoint
	} else {
		presignEndpoint = endpoint
	}

	presignClient := s3.New(s3.Options{
		Credentials:  credentialsProvider,
		BaseEndpoint: &presignEndpoint,
		Region:       "garage",
		UsePathStyle: true,
	})

	gs := &GarageStorage{
		client:    client,
		presigner: s3.NewPresignClient(presignClient),
	}

	return gs, nil
}

// GeneratePresignedUploadURL generates a pre-signed URL for uploading
func (s *GarageStorage) GeneratePresignedUploadURL(ctx context.Context, vehicleID, photoID uuid.UUID, bucketName, fileType, fileExtension string) (objectKey string, uploadURL string, err error) {
	objectKey = fmt.Sprintf("%s/%s/%s%s", vehicleID.String(), fileType, photoID.String(), fileExtension)

	presignRequest, err := s.presigner.PresignPutObject(ctx,
		&s3.PutObjectInput{
			Bucket: aws.String(bucketName),
			Key:    aws.String(objectKey),
		},
		func(opts *s3.PresignOptions) {
			opts.Expires = presignedURLExpiry
		},
	)
	if err != nil {
		return "", "", err
	}

	return objectKey, presignRequest.URL, nil
}

// DeleteObject deletes an object from storage
func (s *GarageStorage) DeleteObject(ctx context.Context, bucket, objectKey string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(objectKey),
	})
	return err
}
