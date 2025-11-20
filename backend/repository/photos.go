package repository

import (
	"context"

	"github.com/google/uuid"

	"github.com/s1moe2/classics-chain/photos"
	"github.com/s1moe2/classics-chain/pkg/postgres"
	"github.com/s1moe2/classics-chain/pkg/postgres/db"
)

type PhotoRepository struct {
	queries db.Querier
}

func NewPhotoRepository(queries db.Querier) *PhotoRepository {
	return &PhotoRepository{queries: queries}
}

func (r *PhotoRepository) ListByVehicle(ctx context.Context, vehicleID uuid.UUID) ([]photos.Photo, error) {
	dbPhotos, err := r.queries.ListPhotosByVehicle(ctx, vehicleID)
	if err != nil {
		return nil, postgres.WrapError(err, "list photos by vehicle")
	}

	result := make([]photos.Photo, len(dbPhotos))
	for i, p := range dbPhotos {
		result[i] = toPhotoDomain(p)
	}

	return result, nil
}

func (r *PhotoRepository) Get(ctx context.Context, id uuid.UUID) (*photos.Photo, error) {
	p, err := r.queries.GetPhoto(ctx, id)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, photos.ErrPhotoNotFound
		}
		return nil, postgres.WrapError(err, "get photo")
	}

	result := toPhotoDomain(p)
	return &result, nil
}

func (r *PhotoRepository) GetByKey(ctx context.Context, vehicleID uuid.UUID, objectKey string) (*photos.Photo, error) {
	p, err := r.queries.GetPhotoByKey(ctx, db.GetPhotoByKeyParams{
		VehicleID: vehicleID,
		ObjectKey: objectKey,
	})
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, photos.ErrPhotoNotFound
		}
		return nil, postgres.WrapError(err, "get photo by key")
	}

	result := toPhotoDomain(p)
	return &result, nil
}

func (r *PhotoRepository) Create(ctx context.Context, params photos.CreatePhotoParams) (*photos.Photo, error) {
	created, err := r.queries.CreatePhoto(ctx, db.CreatePhotoParams{
		VehicleID: params.VehicleID,
		ObjectKey: params.ObjectKey,
		UploadUrl: &params.UploadURL,
	})
	if err != nil {
		return nil, postgres.WrapError(err, "create photo")
	}

	result := toPhotoDomain(created)
	return &result, nil
}

func (r *PhotoRepository) ConfirmUpload(ctx context.Context, id uuid.UUID) (*photos.Photo, error) {
	confirmed, err := r.queries.ConfirmPhotoUpload(ctx, id)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, photos.ErrPhotoNotFound
		}
		return nil, postgres.WrapError(err, "confirm photo upload")
	}

	result := toPhotoDomain(confirmed)
	return &result, nil
}

func (r *PhotoRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return postgres.WrapError(r.queries.DeletePhoto(ctx, id), "delete photo")
}

func (r *PhotoRepository) CountByVehicle(ctx context.Context, vehicleID uuid.UUID) (int, error) {
	count, err := r.queries.CountPhotosByVehicle(ctx, vehicleID)
	if err != nil {
		return 0, postgres.WrapError(err, "count photos by vehicle")
	}
	return int(count), nil
}

func toPhotoDomain(p db.VehiclePhoto) photos.Photo {
	return photos.Photo{
		ID:        p.ID,
		VehicleID: p.VehicleID,
		ObjectKey: p.ObjectKey,
		UploadURL: p.UploadUrl,
		CreatedAt: p.CreatedAt.Time,
	}
}
