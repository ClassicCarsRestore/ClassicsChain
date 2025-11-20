package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/s1moe2/classics-chain/pkg/postgres"
	"github.com/s1moe2/classics-chain/pkg/postgres/db"
	"github.com/s1moe2/classics-chain/vehicleshare"
)

type ShareLinkRepository struct {
	queries db.Querier
}

func NewShareLinkRepository(queries db.Querier) vehicleshare.Repository {
	return &ShareLinkRepository{queries: queries}
}

func (r *ShareLinkRepository) Create(ctx context.Context, params vehicleshare.CreateShareLinkParams) (*vehicleshare.ShareLink, error) {
	expiresAt := time.Now()
	switch params.Duration {
	case "1h":
		expiresAt = expiresAt.Add(1 * time.Hour)
	case "24h":
		expiresAt = expiresAt.Add(24 * time.Hour)
	case "7d":
		expiresAt = expiresAt.Add(7 * 24 * time.Hour)
	case "30d":
		expiresAt = expiresAt.Add(30 * 24 * time.Hour)
	}

	token, err := vehicleshare.GenerateShareToken()
	if err != nil {
		return nil, err
	}

	dbShareLink, err := r.queries.CreateShareLink(ctx, db.CreateShareLinkParams{
		VehicleID:        params.VehicleID,
		Token:            token,
		CanViewDetails:   params.CanViewDetails,
		CanViewPhotos:    params.CanViewPhotos,
		CanViewDocuments: params.CanViewDocuments,
		CanViewHistory:   params.CanViewHistory,
		RecipientEmail:   params.RecipientEmail,
		ExpiresAt:        pgtype.Timestamptz{Time: expiresAt, Valid: true},
	})
	if err != nil {
		return nil, postgres.WrapError(err, "create share link")
	}

	return toShareLinkDomain(dbShareLink), nil
}

func (r *ShareLinkRepository) GetByToken(ctx context.Context, token string) (*vehicleshare.ShareLink, error) {
	dbShareLink, err := r.queries.GetShareLinkByToken(ctx, token)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, vehicleshare.ErrShareLinkNotFound
		}
		return nil, postgres.WrapError(err, "get share link by token")
	}

	return toShareLinkDomain(dbShareLink), nil
}

func (r *ShareLinkRepository) GetByID(ctx context.Context, id uuid.UUID) (*vehicleshare.ShareLink, error) {
	dbShareLink, err := r.queries.GetShareLinkByID(ctx, id)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, vehicleshare.ErrShareLinkNotFound
		}
		return nil, postgres.WrapError(err, "get share link by id")
	}

	return toShareLinkDomain(dbShareLink), nil
}

func (r *ShareLinkRepository) ListByVehicle(ctx context.Context, vehicleID uuid.UUID) ([]vehicleshare.ShareLink, error) {
	dbShareLinks, err := r.queries.ListShareLinksByVehicle(ctx, vehicleID)
	if err != nil {
		return nil, postgres.WrapError(err, "list share links by vehicle")
	}

	result := make([]vehicleshare.ShareLink, len(dbShareLinks))
	for i, dbShareLink := range dbShareLinks {
		result[i] = *toShareLinkDomain(dbShareLink)
	}

	return result, nil
}

func (r *ShareLinkRepository) IncrementAccessCount(ctx context.Context, id uuid.UUID) error {
	_, err := r.queries.IncrementShareLinkAccessCount(ctx, id)
	return postgres.WrapError(err, "increment share link access count")
}

func (r *ShareLinkRepository) Revoke(ctx context.Context, id uuid.UUID) (*vehicleshare.ShareLink, error) {
	dbShareLink, err := r.queries.RevokeShareLink(ctx, id)
	if err != nil {
		return nil, postgres.WrapError(err, "revoke share link")
	}

	return toShareLinkDomain(dbShareLink), nil
}

func toShareLinkDomain(dbShareLink db.VehicleShareLink) *vehicleshare.ShareLink {
	return &vehicleshare.ShareLink{
		ID:               dbShareLink.ID,
		VehicleID:        dbShareLink.VehicleID,
		Token:            dbShareLink.Token,
		CanViewDetails:   dbShareLink.CanViewDetails,
		CanViewPhotos:    dbShareLink.CanViewPhotos,
		CanViewDocuments: dbShareLink.CanViewDocuments,
		CanViewHistory:   dbShareLink.CanViewHistory,
		RecipientEmail:   dbShareLink.RecipientEmail,
		ExpiresAt:        dbShareLink.ExpiresAt.Time,
		CreatedAt:        dbShareLink.CreatedAt.Time,
		AccessedCount:    int(dbShareLink.AccessedCount),
		LastAccessedAt: func() *time.Time {
			if dbShareLink.LastAccessedAt.Valid {
				return &dbShareLink.LastAccessedAt.Time
			}
			return nil
		}(),
		RevokedAt: func() *time.Time {
			if dbShareLink.RevokedAt.Valid {
				return &dbShareLink.RevokedAt.Time
			}
			return nil
		}(),
	}
}
