package repository

import (
	"context"

	"github.com/google/uuid"

	"github.com/s1moe2/classics-chain/eventimages"
	"github.com/s1moe2/classics-chain/pkg/postgres"
	"github.com/s1moe2/classics-chain/pkg/postgres/db"
)

type EventImageRepository struct {
	queries db.Querier
}

func NewEventImageRepository(queries db.Querier) *EventImageRepository {
	return &EventImageRepository{queries: queries}
}

func (r *EventImageRepository) Create(ctx context.Context, params eventimages.CreateEventImageParams) (*eventimages.EventImage, error) {
	created, err := r.queries.CreateEventImage(ctx, db.CreateEventImageParams{
		UploadSessionID: params.UploadSessionID,
		ObjectKey:       params.ObjectKey,
		UploadUrl:       &params.UploadURL,
	})
	if err != nil {
		return nil, postgres.WrapError(err, "create event image")
	}

	result := toEventImageDomain(created)
	return &result, nil
}

func (r *EventImageRepository) Get(ctx context.Context, id uuid.UUID) (*eventimages.EventImage, error) {
	img, err := r.queries.GetEventImage(ctx, id)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, eventimages.ErrEventImageNotFound
		}
		return nil, postgres.WrapError(err, "get event image")
	}

	result := toEventImageDomain(img)
	return &result, nil
}

func (r *EventImageRepository) ListBySession(ctx context.Context, sessionID uuid.UUID) ([]eventimages.EventImage, error) {
	dbImages, err := r.queries.ListEventImagesBySession(ctx, sessionID)
	if err != nil {
		return nil, postgres.WrapError(err, "list event images by session")
	}

	result := make([]eventimages.EventImage, len(dbImages))
	for i, img := range dbImages {
		result[i] = toEventImageDomain(img)
	}

	return result, nil
}

func (r *EventImageRepository) ListByEvent(ctx context.Context, eventID uuid.UUID) ([]eventimages.EventImage, error) {
	dbImages, err := r.queries.ListEventImagesByEvent(ctx, &eventID)
	if err != nil {
		return nil, postgres.WrapError(err, "list event images by event")
	}

	result := make([]eventimages.EventImage, len(dbImages))
	for i, img := range dbImages {
		result[i] = toEventImageDomain(img)
	}

	return result, nil
}

func (r *EventImageRepository) ConfirmUpload(ctx context.Context, id uuid.UUID, cid string) (*eventimages.EventImage, error) {
	confirmed, err := r.queries.ConfirmEventImageUpload(ctx, db.ConfirmEventImageUploadParams{
		ID:  id,
		Cid: &cid,
	})
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, eventimages.ErrEventImageNotFound
		}
		return nil, postgres.WrapError(err, "confirm event image upload")
	}

	result := toEventImageDomain(confirmed)
	return &result, nil
}

func (r *EventImageRepository) AttachToEvent(ctx context.Context, sessionID, eventID uuid.UUID) error {
	return postgres.WrapError(r.queries.AttachEventImagesToEvent(ctx, db.AttachEventImagesToEventParams{
		UploadSessionID: sessionID,
		EventID:         &eventID,
	}), "attach event images to event")
}

func (r *EventImageRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return postgres.WrapError(r.queries.DeleteEventImage(ctx, id), "delete event image")
}

func (r *EventImageRepository) CountBySession(ctx context.Context, sessionID uuid.UUID) (int, error) {
	count, err := r.queries.CountEventImagesBySession(ctx, sessionID)
	if err != nil {
		return 0, postgres.WrapError(err, "count event images by session")
	}
	return int(count), nil
}

func toEventImageDomain(img db.EventImage) eventimages.EventImage {
	return eventimages.EventImage{
		ID:              img.ID,
		EventID:         img.EventID,
		UploadSessionID: img.UploadSessionID,
		ObjectKey:       img.ObjectKey,
		CID:             img.Cid,
		UploadURL:       img.UploadUrl,
		CreatedAt:       img.CreatedAt.Time,
	}
}
