package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/s1moe2/classics-chain/invitation"
	"github.com/s1moe2/classics-chain/pkg/postgres"
	"github.com/s1moe2/classics-chain/pkg/postgres/db"
)

type InvitationRepository struct {
	queries db.Querier
}

func NewInvitationRepository(queries db.Querier) *InvitationRepository {
	return &InvitationRepository{queries: queries}
}

func (r *InvitationRepository) CreateInvitation(ctx context.Context, params invitation.CreateInvitationParams) (*invitation.Invitation, error) {
	inv, err := r.queries.CreateInvitation(ctx, db.CreateInvitationParams{
		VehicleID:      params.VehicleID,
		Email:          params.Email,
		Token:          &params.Token,
		TokenExpiresAt: pgtype.Timestamp{Time: params.TokenExpiresAt, Valid: true},
	})
	if err != nil {
		return nil, postgres.WrapError(err, "create invitation")
	}
	return &invitation.Invitation{
		ID:             inv.ID,
		VehicleID:      inv.VehicleID,
		Email:          inv.Email,
		Token:          inv.Token,
		TokenExpiresAt: timestampToTimePtr(inv.TokenExpiresAt),
		InvitedAt:      inv.InvitedAt.Time,
		ClaimedAt:      timestampToTimePtr(inv.ClaimedAt),
	}, nil
}

func (r *InvitationRepository) GetPendingInvitationsByEmail(ctx context.Context, email string) ([]invitation.Invitation, error) {
	invs, err := r.queries.GetPendingInvitationsByEmail(ctx, email)
	if err != nil {
		return nil, postgres.WrapError(err, "get pending invitations by email")
	}

	result := make([]invitation.Invitation, len(invs))
	for i, inv := range invs {
		result[i] = invitation.Invitation{
			ID:        inv.ID,
			VehicleID: inv.VehicleID,
			Email:     inv.Email,
			InvitedAt: inv.InvitedAt.Time,
			ClaimedAt: timestampToTimePtr(inv.ClaimedAt),
		}
	}
	return result, nil
}

func (r *InvitationRepository) GetInvitationsByEmailAndVehicle(ctx context.Context, email string, vehicleIDs []uuid.UUID) ([]invitation.Invitation, error) {
	invs, err := r.queries.GetInvitationsByEmailAndVehicle(ctx, db.GetInvitationsByEmailAndVehicleParams{
		Email:   email,
		Column2: vehicleIDs,
	})
	if err != nil {
		return nil, postgres.WrapError(err, "get invitations by email and vehicle")
	}
	result := make([]invitation.Invitation, len(invs))
	for i, inv := range invs {
		result[i] = invitation.Invitation{
			ID:        inv.ID,
			VehicleID: inv.VehicleID,
			Email:     inv.Email,
			InvitedAt: inv.InvitedAt.Time,
			ClaimedAt: timestampToTimePtr(inv.ClaimedAt),
		}
	}
	return result, nil
}

func (r *InvitationRepository) ClaimInvitation(ctx context.Context, invitationID uuid.UUID) (*invitation.Invitation, error) {
	inv, err := r.queries.ClaimInvitation(ctx, invitationID)
	if err != nil {
		return nil, postgres.WrapError(err, "claim invitation")
	}
	return &invitation.Invitation{
		ID:        inv.ID,
		VehicleID: inv.VehicleID,
		Email:     inv.Email,
		InvitedAt: inv.InvitedAt.Time,
		ClaimedAt: timestampToTimePtr(inv.ClaimedAt),
	}, nil
}

func (r *InvitationRepository) ClaimInvitationsByEmail(ctx context.Context, email string) error {
	err := r.queries.ClaimInvitationsByEmail(ctx, email)
	if err != nil {
		return postgres.WrapError(err, "claim invitations by email")
	}
	return nil
}

func (r *InvitationRepository) DeleteInvitation(ctx context.Context, id uuid.UUID) error {
	err := r.queries.DeleteInvitation(ctx, id)
	if err != nil {
		return postgres.WrapError(err, "delete invitation")
	}
	return nil
}

func (r *InvitationRepository) GetInvitationByID(ctx context.Context, id uuid.UUID) (*invitation.Invitation, error) {
	inv, err := r.queries.GetInvitationByID(ctx, id)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, invitation.ErrInvitationNotFound
		}
		return nil, postgres.WrapError(err, "get invitation by id")
	}
	return &invitation.Invitation{
		ID:        inv.ID,
		VehicleID: inv.VehicleID,
		Email:     inv.Email,
		InvitedAt: inv.InvitedAt.Time,
		ClaimedAt: timestampToTimePtr(inv.ClaimedAt),
	}, nil
}

func (r *InvitationRepository) GetAllPendingInvitations(ctx context.Context) ([]invitation.Invitation, error) {
	invs, err := r.queries.GetAllPendingInvitations(ctx)
	if err != nil {
		return nil, postgres.WrapError(err, "get all pending invitations")
	}
	result := make([]invitation.Invitation, len(invs))
	for i, inv := range invs {
		result[i] = invitation.Invitation{
			ID:             inv.ID,
			VehicleID:      inv.VehicleID,
			Email:          inv.Email,
			Token:          inv.Token,
			TokenExpiresAt: timestampToTimePtr(inv.TokenExpiresAt),
			InvitedAt:      inv.InvitedAt.Time,
			ClaimedAt:      timestampToTimePtr(inv.ClaimedAt),
		}
	}
	return result, nil
}

func (r *InvitationRepository) GetInvitationByToken(ctx context.Context, token string) (*invitation.Invitation, error) {
	inv, err := r.queries.GetInvitationByToken(ctx, &token)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, invitation.ErrInvitationNotFound
		}
		return nil, postgres.WrapError(err, "get invitation by token")
	}

	return &invitation.Invitation{
		ID:             inv.ID,
		VehicleID:      inv.VehicleID,
		Email:          inv.Email,
		Token:          inv.Token,
		TokenExpiresAt: timestampToTimePtr(inv.TokenExpiresAt),
		InvitedAt:      inv.InvitedAt.Time,
		ClaimedAt:      timestampToTimePtr(inv.ClaimedAt),
	}, nil
}

// timestampToTimePtr converts a pgtype.Timestamp to *time.Time
func timestampToTimePtr(ts pgtype.Timestamp) *time.Time {
	if ts.Valid {
		return &ts.Time
	}
	return nil
}
