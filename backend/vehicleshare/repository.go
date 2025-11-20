package vehicleshare

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, params CreateShareLinkParams) (*ShareLink, error)
	GetByToken(ctx context.Context, token string) (*ShareLink, error)
	GetByID(ctx context.Context, id uuid.UUID) (*ShareLink, error)
	ListByVehicle(ctx context.Context, vehicleID uuid.UUID) ([]ShareLink, error)
	IncrementAccessCount(ctx context.Context, id uuid.UUID) error
	Revoke(ctx context.Context, id uuid.UUID) (*ShareLink, error)
}
