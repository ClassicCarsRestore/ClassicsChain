package user_invitation

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/google/uuid"
)

const TokenExpiryDays = 7

type Repository interface {
	CreateUserInvitation(ctx context.Context, params CreateUserInvitationParams) (*UserInvitation, error)
	GetUserInvitationByToken(ctx context.Context, token string) (*UserInvitation, error)
	GetPendingUserInvitationsByEmail(ctx context.Context, email string) ([]UserInvitation, error)
	ClaimUserInvitation(ctx context.Context, token string) error
	GetUserInvitationByID(ctx context.Context, id uuid.UUID) (*UserInvitation, error)
	DeleteUserInvitation(ctx context.Context, id uuid.UUID) error
}

type Mailer interface {
	SendAdminInvitation(ctx context.Context, email, name, token string) error
	SendEntityMemberInvitation(ctx context.Context, email, name, token, entityName, role string) error
}

type Service struct {
	repo   Repository
	mailer Mailer
}

func NewService(repo Repository, mailer Mailer) *Service {
	return &Service{
		repo:   repo,
		mailer: mailer,
	}
}

func (s *Service) CreateAdminInvitation(ctx context.Context, params CreateAdminInvitationParams) (*UserInvitation, error) {
	token, err := generateInvitationToken()
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	invitationParams := CreateUserInvitationParams{
		Email:          params.Email,
		Name:           params.Name,
		Token:          token,
		TokenExpiresAt: time.Now().Add(TokenExpiryDays * 24 * time.Hour),
		InvitationType: TypeAdmin,
	}

	invitation, err := s.repo.CreateUserInvitation(ctx, invitationParams)
	if err != nil {
		return nil, fmt.Errorf("create invitation: %w", err)
	}

	name := "there"
	if params.Name != nil {
		name = *params.Name
	}

	if err := s.mailer.SendAdminInvitation(ctx, params.Email, name, token); err != nil {
		return nil, fmt.Errorf("send invitation email: %w", err)
	}

	return invitation, nil
}

func (s *Service) CreateEntityMemberInvitation(ctx context.Context, params CreateEntityMemberInvitationParams) (*UserInvitation, error) {
	token, err := generateInvitationToken()
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	invitationParams := CreateUserInvitationParams{
		Email:          params.Email,
		Name:           params.Name,
		Token:          token,
		TokenExpiresAt: time.Now().Add(TokenExpiryDays * 24 * time.Hour),
		EntityID:       &params.EntityID,
		InvitationType: TypeEntityMember,
		EntityRole:     &params.Role,
	}

	invitation, err := s.repo.CreateUserInvitation(ctx, invitationParams)
	if err != nil {
		return nil, fmt.Errorf("create invitation: %w", err)
	}

	name := "there"
	if params.Name != nil {
		name = *params.Name
	}

	if err := s.mailer.SendEntityMemberInvitation(ctx, params.Email, name, token, params.EntityName, params.Role); err != nil {
		return nil, fmt.Errorf("send invitation email: %w", err)
	}

	return invitation, nil
}

func (s *Service) ValidateInvitationToken(ctx context.Context, token string) (*UserInvitation, error) {
	invitation, err := s.repo.GetUserInvitationByToken(ctx, token)
	if err != nil {
		return nil, ErrInvitationNotFound
	}

	if invitation.ClaimedAt != nil {
		return nil, ErrInvitationClaimed
	}

	if time.Now().After(invitation.TokenExpiresAt) {
		return nil, ErrInvitationExpired
	}

	return invitation, nil
}

func (s *Service) ClaimInvitation(ctx context.Context, token string) error {
	return s.repo.ClaimUserInvitation(ctx, token)
}

func (s *Service) GetPendingInvitationsByEmail(ctx context.Context, email string) ([]UserInvitation, error) {
	return s.repo.GetPendingUserInvitationsByEmail(ctx, email)
}

func generateInvitationToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}
