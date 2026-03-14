package event_images

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrEventImageNotFound   = errors.New("event image not found")
	ErrMaxImagesExceeded    = errors.New("upload session has reached maximum number of images (10)")
	ErrImageNotConfirmed    = errors.New("image upload not confirmed")
	ErrSessionHasNoImages   = errors.New("upload session has no images")
	ErrImageAlreadyAttached = errors.New("image already attached to an event")
)

const MaxImagesPerEvent = 10

type EventImage struct {
	ID              uuid.UUID  `json:"id"`
	EventID         *uuid.UUID `json:"eventId,omitempty"`
	UploadSessionID uuid.UUID  `json:"uploadSessionId"`
	ObjectKey       string     `json:"objectKey"`
	CID             *string    `json:"cid,omitempty"`
	UploadURL       *string    `json:"uploadUrl,omitempty"`
	CreatedAt       time.Time  `json:"createdAt"`
}

type CreateEventImageParams struct {
	UploadSessionID uuid.UUID
	ObjectKey       string
	UploadURL       string
}

type GenerateUploadParams struct {
	SessionID     uuid.UUID
	Filename      string
	FileExtension string
}

type Repository interface {
	Create(ctx context.Context, params CreateEventImageParams) (*EventImage, error)
	Get(ctx context.Context, id uuid.UUID) (*EventImage, error)
	ListBySession(ctx context.Context, sessionID uuid.UUID) ([]EventImage, error)
	ListByEvent(ctx context.Context, eventID uuid.UUID) ([]EventImage, error)
	ConfirmUpload(ctx context.Context, id uuid.UUID, cid string) (*EventImage, error)
	AttachToEvent(ctx context.Context, sessionID, eventID uuid.UUID) error
	Delete(ctx context.Context, id uuid.UUID) error
	CountBySession(ctx context.Context, sessionID uuid.UUID) (int, error)
}
