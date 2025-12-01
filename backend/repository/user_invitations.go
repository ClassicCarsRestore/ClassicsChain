package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/s1moe2/classics-chain/pkg/postgres"
	"github.com/s1moe2/classics-chain/pkg/postgres/db"
	"github.com/s1moe2/classics-chain/user_invitation"
)

type UserInvitationRepository struct {
	queries db.Querier
}

func NewUserInvitationRepository(queries db.Querier) *UserInvitationRepository {
	return &UserInvitationRepository{queries: queries}
}

func (r *UserInvitationRepository) CreateUserInvitation(ctx context.Context, params user_invitation.CreateUserInvitationParams) (*user_invitation.UserInvitation, error) {
	inv, err := r.queries.CreateUserInvitation(ctx, db.CreateUserInvitationParams{
		Email:          params.Email,
		Name:           params.Name,
		Token:          params.Token,
		TokenExpiresAt: pgtype.Timestamp{Time: params.TokenExpiresAt, Valid: true},
		InvitationType: string(params.InvitationType),
		EntityID:       params.EntityID,
		EntityRole:     params.EntityRole,
	})
	if err != nil {
		return nil, postgres.WrapError(err, "create user invitation")
	}
	return r.toDomainInvitation(&inv), nil
}

func (r *UserInvitationRepository) GetPendingUserInvitationsByEmail(ctx context.Context, email string) ([]user_invitation.UserInvitation, error) {
	invs, err := r.queries.GetPendingUserInvitationsByEmail(ctx, email)
	if err != nil {
		return nil, postgres.WrapError(err, "get pending user invitations by email")
	}

	result := make([]user_invitation.UserInvitation, len(invs))
	for i, inv := range invs {
		result[i] = *r.toDomainInvitation(&inv)
	}
	return result, nil
}

func (r *UserInvitationRepository) GetUserInvitationByToken(ctx context.Context, token string) (*user_invitation.UserInvitation, error) {
	inv, err := r.queries.GetUserInvitationByToken(ctx, token)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, user_invitation.ErrInvitationNotFound
		}
		return nil, postgres.WrapError(err, "get user invitation by token")
	}
	return r.toDomainInvitation(&inv), nil
}

func (r *UserInvitationRepository) ClaimUserInvitation(ctx context.Context, token string) error {
	err := r.queries.ClaimUserInvitation(ctx, token)
	if err != nil {
		return postgres.WrapError(err, "claim user invitation")
	}
	return nil
}

func (r *UserInvitationRepository) GetUserInvitationByID(ctx context.Context, id uuid.UUID) (*user_invitation.UserInvitation, error) {
	inv, err := r.queries.GetUserInvitationByID(ctx, id)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, user_invitation.ErrInvitationNotFound
		}
		return nil, postgres.WrapError(err, "get user invitation by id")
	}
	return r.toDomainInvitation(&inv), nil
}

func (r *UserInvitationRepository) DeleteUserInvitation(ctx context.Context, id uuid.UUID) error {
	err := r.queries.DeleteUserInvitation(ctx, id)
	if err != nil {
		return postgres.WrapError(err, "delete user invitation")
	}
	return nil
}

func (r *UserInvitationRepository) toDomainInvitation(inv *db.UserInvitation) *user_invitation.UserInvitation {
	return &user_invitation.UserInvitation{
		ID:             inv.ID,
		Email:          inv.Email,
		Name:           inv.Name,
		Token:          inv.Token,
		TokenExpiresAt: inv.TokenExpiresAt.Time,
		InvitedAt:      inv.InvitedAt.Time,
		ClaimedAt:      timestampToTimePtr(inv.ClaimedAt),
		InvitationType: user_invitation.InvitationType(inv.InvitationType),
		EntityID:       inv.EntityID,
		EntityRole:     inv.EntityRole,
	}
}
