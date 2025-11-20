package repository

import (
	"context"

	"github.com/google/uuid"

	"github.com/s1moe2/classics-chain/documents"
	"github.com/s1moe2/classics-chain/pkg/postgres"
	"github.com/s1moe2/classics-chain/pkg/postgres/db"
)

type DocumentRepository struct {
	queries db.Querier
}

func NewDocumentRepository(queries db.Querier) *DocumentRepository {
	return &DocumentRepository{queries: queries}
}

func (r *DocumentRepository) ListByVehicle(ctx context.Context, vehicleID uuid.UUID) ([]documents.Document, error) {
	dbDocuments, err := r.queries.ListDocumentsByVehicle(ctx, vehicleID)
	if err != nil {
		return nil, postgres.WrapError(err, "list documents by vehicle")
	}

	result := make([]documents.Document, len(dbDocuments))
	for i, d := range dbDocuments {
		result[i] = toDocumentDomain(d)
	}

	return result, nil
}

func (r *DocumentRepository) Get(ctx context.Context, id uuid.UUID) (*documents.Document, error) {
	d, err := r.queries.GetDocument(ctx, id)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, documents.ErrDocumentNotFound
		}
		return nil, postgres.WrapError(err, "get document")
	}

	result := toDocumentDomain(d)
	return &result, nil
}

func (r *DocumentRepository) GetByKey(ctx context.Context, vehicleID uuid.UUID, objectKey string) (*documents.Document, error) {
	d, err := r.queries.GetDocumentByKey(ctx, db.GetDocumentByKeyParams{
		VehicleID: vehicleID,
		ObjectKey: objectKey,
	})
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, documents.ErrDocumentNotFound
		}
		return nil, postgres.WrapError(err, "get document by key")
	}

	result := toDocumentDomain(d)
	return &result, nil
}

func (r *DocumentRepository) Create(ctx context.Context, params documents.CreateDocumentParams) (*documents.Document, error) {
	created, err := r.queries.CreateDocument(ctx, db.CreateDocumentParams{
		VehicleID: params.VehicleID,
		ObjectKey: params.ObjectKey,
		Filename:  params.Filename,
		UploadUrl: &params.UploadURL,
	})
	if err != nil {
		return nil, postgres.WrapError(err, "create document")
	}

	result := toDocumentDomain(created)
	return &result, nil
}

func (r *DocumentRepository) ConfirmUpload(ctx context.Context, id uuid.UUID) (*documents.Document, error) {
	confirmed, err := r.queries.ConfirmDocumentUpload(ctx, id)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, documents.ErrDocumentNotFound
		}
		return nil, postgres.WrapError(err, "confirm document upload")
	}

	result := toDocumentDomain(confirmed)
	return &result, nil
}

func (r *DocumentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return postgres.WrapError(r.queries.DeleteDocument(ctx, id), "delete document")
}

func (r *DocumentRepository) CountByVehicle(ctx context.Context, vehicleID uuid.UUID) (int, error) {
	count, err := r.queries.CountDocumentsByVehicle(ctx, vehicleID)
	if err != nil {
		return 0, postgres.WrapError(err, "count documents by vehicle")
	}
	return int(count), nil
}

func toDocumentDomain(d db.VehicleDocument) documents.Document {
	return documents.Document{
		ID:        d.ID,
		VehicleID: d.VehicleID,
		ObjectKey: d.ObjectKey,
		Filename:  d.Filename,
		UploadURL: d.UploadUrl,
		CreatedAt: d.CreatedAt.Time,
	}
}
