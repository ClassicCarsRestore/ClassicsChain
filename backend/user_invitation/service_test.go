package user_invitation

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// --- Mocks ---

type mockRepo struct {
	createFunc     func(ctx context.Context, params CreateUserInvitationParams) (*UserInvitation, error)
	getByTokenFunc func(ctx context.Context, token string) (*UserInvitation, error)
	claimFunc      func(ctx context.Context, token string) error
}

func (m *mockRepo) CreateUserInvitation(ctx context.Context, params CreateUserInvitationParams) (*UserInvitation, error) {
	if m.createFunc != nil {
		return m.createFunc(ctx, params)
	}
	return &UserInvitation{ID: uuid.New(), Token: params.Token}, nil
}
func (m *mockRepo) GetUserInvitationByToken(ctx context.Context, token string) (*UserInvitation, error) {
	if m.getByTokenFunc != nil {
		return m.getByTokenFunc(ctx, token)
	}
	return nil, ErrInvitationNotFound
}
func (m *mockRepo) GetPendingUserInvitationsByEmail(ctx context.Context, email string) ([]UserInvitation, error) {
	return nil, nil
}
func (m *mockRepo) ClaimUserInvitation(ctx context.Context, token string) error {
	if m.claimFunc != nil {
		return m.claimFunc(ctx, token)
	}
	return nil
}
func (m *mockRepo) GetUserInvitationByID(ctx context.Context, id uuid.UUID) (*UserInvitation, error) {
	return nil, nil
}
func (m *mockRepo) DeleteUserInvitation(ctx context.Context, id uuid.UUID) error { return nil }

type mockMailer struct {
	sendAdminFunc        func(ctx context.Context, email, name, token string) error
	sendEntityMemberFunc func(ctx context.Context, email, name, token, entityName, role string) error
}

func (m *mockMailer) SendAdminInvitation(ctx context.Context, email, name, token string) error {
	if m.sendAdminFunc != nil {
		return m.sendAdminFunc(ctx, email, name, token)
	}
	return nil
}
func (m *mockMailer) SendEntityMemberInvitation(ctx context.Context, email, name, token, entityName, role string) error {
	if m.sendEntityMemberFunc != nil {
		return m.sendEntityMemberFunc(ctx, email, name, token, entityName, role)
	}
	return nil
}

// --- Tests ---

func ptr[T any](v T) *T { return &v }

func TestService_CreateAdminInvitation_Success(t *testing.T) {
	var sentName string
	var createdType InvitationType

	repo := &mockRepo{
		createFunc: func(_ context.Context, params CreateUserInvitationParams) (*UserInvitation, error) {
			createdType = params.InvitationType
			return &UserInvitation{ID: uuid.New(), Token: params.Token}, nil
		},
	}
	mailer := &mockMailer{
		sendAdminFunc: func(_ context.Context, _, name, _ string) error {
			sentName = name
			return nil
		},
	}
	svc := NewService(repo, mailer)

	result, err := svc.CreateAdminInvitation(context.Background(), CreateAdminInvitationParams{
		Email: "admin@test.com",
		Name:  ptr("John"),
	})

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, TypeAdmin, createdType)
	assert.Equal(t, "John", sentName)
}

func TestService_CreateAdminInvitation_NilNameFallback(t *testing.T) {
	var sentName string
	mailer := &mockMailer{
		sendAdminFunc: func(_ context.Context, _, name, _ string) error {
			sentName = name
			return nil
		},
	}
	svc := NewService(&mockRepo{}, mailer)

	_, err := svc.CreateAdminInvitation(context.Background(), CreateAdminInvitationParams{
		Email: "admin@test.com",
		Name:  nil,
	})

	require.NoError(t, err)
	assert.Equal(t, "there", sentName)
}

func TestService_CreateEntityMemberInvitation_Success(t *testing.T) {
	var sentEntityName, sentRole string
	var createdParams CreateUserInvitationParams

	entityID := uuid.New()
	repo := &mockRepo{
		createFunc: func(_ context.Context, params CreateUserInvitationParams) (*UserInvitation, error) {
			createdParams = params
			return &UserInvitation{ID: uuid.New(), Token: params.Token}, nil
		},
	}
	mailer := &mockMailer{
		sendEntityMemberFunc: func(_ context.Context, _, _, _, entityName, role string) error {
			sentEntityName = entityName
			sentRole = role
			return nil
		},
	}
	svc := NewService(repo, mailer)

	_, err := svc.CreateEntityMemberInvitation(context.Background(), CreateEntityMemberInvitationParams{
		Email:      "member@test.com",
		Name:       ptr("Jane"),
		EntityID:   entityID,
		EntityName: "ACP Clássicos",
		Role:       "member",
	})

	require.NoError(t, err)
	assert.Equal(t, TypeEntityMember, createdParams.InvitationType)
	assert.Equal(t, &entityID, createdParams.EntityID)
	assert.Equal(t, "ACP Clássicos", sentEntityName)
	assert.Equal(t, "member", sentRole)
}

func TestService_CreateEntityMemberInvitation_NilNameFallback(t *testing.T) {
	var sentName string
	mailer := &mockMailer{
		sendEntityMemberFunc: func(_ context.Context, _, name, _, _, _ string) error {
			sentName = name
			return nil
		},
	}
	svc := NewService(&mockRepo{}, mailer)

	_, err := svc.CreateEntityMemberInvitation(context.Background(), CreateEntityMemberInvitationParams{
		Email:      "member@test.com",
		Name:       nil,
		EntityName: "Test",
		Role:       "member",
	})

	require.NoError(t, err)
	assert.Equal(t, "there", sentName)
}

func TestService_ValidateInvitationToken_Success(t *testing.T) {
	invitation := &UserInvitation{
		ID:             uuid.New(),
		Token:          "valid-token",
		TokenExpiresAt: time.Now().Add(24 * time.Hour),
		ClaimedAt:      nil,
	}
	repo := &mockRepo{
		getByTokenFunc: func(_ context.Context, _ string) (*UserInvitation, error) {
			return invitation, nil
		},
	}
	svc := NewService(repo, &mockMailer{})

	result, err := svc.ValidateInvitationToken(context.Background(), "valid-token")
	require.NoError(t, err)
	assert.Equal(t, invitation.ID, result.ID)
}

func TestService_ValidateInvitationToken_NotFound(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockMailer{})

	_, err := svc.ValidateInvitationToken(context.Background(), "invalid")
	assert.ErrorIs(t, err, ErrInvitationNotFound)
}

func TestService_ValidateInvitationToken_Claimed(t *testing.T) {
	now := time.Now()
	repo := &mockRepo{
		getByTokenFunc: func(_ context.Context, _ string) (*UserInvitation, error) {
			return &UserInvitation{
				TokenExpiresAt: time.Now().Add(24 * time.Hour),
				ClaimedAt:      &now,
			}, nil
		},
	}
	svc := NewService(repo, &mockMailer{})

	_, err := svc.ValidateInvitationToken(context.Background(), "claimed-token")
	assert.ErrorIs(t, err, ErrInvitationClaimed)
}

func TestService_ValidateInvitationToken_Expired(t *testing.T) {
	repo := &mockRepo{
		getByTokenFunc: func(_ context.Context, _ string) (*UserInvitation, error) {
			return &UserInvitation{
				TokenExpiresAt: time.Now().Add(-24 * time.Hour),
				ClaimedAt:      nil,
			}, nil
		},
	}
	svc := NewService(repo, &mockMailer{})

	_, err := svc.ValidateInvitationToken(context.Background(), "expired-token")
	assert.ErrorIs(t, err, ErrInvitationExpired)
}
