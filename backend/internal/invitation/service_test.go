package invitation

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	kratos "github.com/ory/kratos-client-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// --- Mocks ---

type mockRepo struct {
	createInvitationFunc            func(ctx context.Context, params CreateInvitationParams) (*Invitation, error)
	getPendingInvitationsByEmailFunc func(ctx context.Context, email string) ([]Invitation, error)
	getInvitationByTokenFunc        func(ctx context.Context, token string) (*Invitation, error)
	claimInvitationFunc             func(ctx context.Context, invitationID uuid.UUID) (*Invitation, error)
}

func (m *mockRepo) CreateInvitation(ctx context.Context, params CreateInvitationParams) (*Invitation, error) {
	if m.createInvitationFunc != nil {
		return m.createInvitationFunc(ctx, params)
	}
	return &Invitation{ID: uuid.New()}, nil
}
func (m *mockRepo) GetPendingInvitationsByEmail(ctx context.Context, email string) ([]Invitation, error) {
	if m.getPendingInvitationsByEmailFunc != nil {
		return m.getPendingInvitationsByEmailFunc(ctx, email)
	}
	return nil, nil
}
func (m *mockRepo) GetInvitationsByEmailAndVehicle(ctx context.Context, email string, vehicleIDs []uuid.UUID) ([]Invitation, error) {
	return nil, nil
}
func (m *mockRepo) GetInvitationByToken(ctx context.Context, token string) (*Invitation, error) {
	if m.getInvitationByTokenFunc != nil {
		return m.getInvitationByTokenFunc(ctx, token)
	}
	return nil, ErrInvitationNotFound
}
func (m *mockRepo) GetPendingInvitationByVehicleID(ctx context.Context, vehicleID uuid.UUID) (*Invitation, error) {
	return nil, nil
}
func (m *mockRepo) ClaimInvitation(ctx context.Context, invitationID uuid.UUID) (*Invitation, error) {
	if m.claimInvitationFunc != nil {
		return m.claimInvitationFunc(ctx, invitationID)
	}
	return &Invitation{}, nil
}
func (m *mockRepo) ClaimInvitationsByEmail(ctx context.Context, email string) error { return nil }
func (m *mockRepo) DeleteInvitation(ctx context.Context, id uuid.UUID) error        { return nil }
func (m *mockRepo) GetInvitationByID(ctx context.Context, id uuid.UUID) (*Invitation, error) {
	return nil, nil
}
func (m *mockRepo) GetAllPendingInvitations(ctx context.Context) ([]Invitation, error) {
	return nil, nil
}

type mockVehicleService struct {
	assignOwnershipFunc func(ctx context.Context, vehicleID, ownerID uuid.UUID) error
}

func (m *mockVehicleService) AssignOwnership(ctx context.Context, vehicleID, ownerID uuid.UUID) error {
	if m.assignOwnershipFunc != nil {
		return m.assignOwnershipFunc(ctx, vehicleID, ownerID)
	}
	return nil
}

type mockMailer struct {
	sendOwnerInvitationFunc func(ctx context.Context, to, token string, vehicles []VehicleInfo) error
}

func (m *mockMailer) SendOwnerInvitation(ctx context.Context, to, token string, vehicles []VehicleInfo) error {
	if m.sendOwnerInvitationFunc != nil {
		return m.sendOwnerInvitationFunc(ctx, to, token, vehicles)
	}
	return nil
}

// --- Tests ---

func TestService_SendInvitationBatch_SharedToken(t *testing.T) {
	var createdTokens []string
	repo := &mockRepo{
		createInvitationFunc: func(_ context.Context, params CreateInvitationParams) (*Invitation, error) {
			createdTokens = append(createdTokens, params.Token)
			return &Invitation{ID: uuid.New()}, nil
		},
	}

	var mailerCalled bool
	var sentVehicles []VehicleInfo
	mailer := &mockMailer{
		sendOwnerInvitationFunc: func(_ context.Context, _, _ string, vehicles []VehicleInfo) error {
			mailerCalled = true
			sentVehicles = vehicles
			return nil
		},
	}

	svc := NewService(repo, &mockVehicleService{}, mailer)

	vehicleIDs := []uuid.UUID{uuid.New(), uuid.New()}
	vehicleData := []map[string]interface{}{
		{"make": "Porsche", "model": "911", "year": float64(1973), "licensePlate": "AA-00-BB"},
		{"make": "BMW", "model": "2002", "year": 1974, "licensePlate": "CC-11-DD"},
	}

	err := svc.SendInvitationBatch(context.Background(), "owner@test.com", vehicleIDs, vehicleData)

	require.NoError(t, err)
	assert.Len(t, createdTokens, 2)
	assert.Equal(t, createdTokens[0], createdTokens[1], "same token for all vehicles")
	assert.True(t, mailerCalled)
	assert.Len(t, sentVehicles, 2)
	assert.Equal(t, "Porsche", sentVehicles[0].Make)
	assert.Equal(t, 1973, sentVehicles[0].Year)
	assert.Equal(t, 1974, sentVehicles[1].Year)
}

func TestService_SendInvitationBatch_RepoError(t *testing.T) {
	repo := &mockRepo{
		createInvitationFunc: func(_ context.Context, _ CreateInvitationParams) (*Invitation, error) {
			return nil, errors.New("db error")
		},
	}
	svc := NewService(repo, &mockVehicleService{}, &mockMailer{})

	err := svc.SendInvitationBatch(context.Background(), "x@test.com", []uuid.UUID{uuid.New()}, nil)
	assert.Error(t, err)
}

func TestService_SendInvitationBatch_MailerError(t *testing.T) {
	mailer := &mockMailer{
		sendOwnerInvitationFunc: func(_ context.Context, _, _ string, _ []VehicleInfo) error {
			return errors.New("smtp error")
		},
	}
	svc := NewService(&mockRepo{}, &mockVehicleService{}, mailer)

	err := svc.SendInvitationBatch(context.Background(), "x@test.com", []uuid.UUID{uuid.New()}, nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "send invitation email")
}

func TestService_ClaimInvitations_Success(t *testing.T) {
	v1 := uuid.New()
	v2 := uuid.New()
	inv1 := Invitation{ID: uuid.New(), VehicleID: v1, Email: "owner@test.com"}
	inv2 := Invitation{ID: uuid.New(), VehicleID: v2, Email: "owner@test.com"}

	var assignedVehicles []uuid.UUID
	var claimedIDs []uuid.UUID

	repo := &mockRepo{
		getPendingInvitationsByEmailFunc: func(_ context.Context, _ string) ([]Invitation, error) {
			return []Invitation{inv1, inv2}, nil
		},
		claimInvitationFunc: func(_ context.Context, id uuid.UUID) (*Invitation, error) {
			claimedIDs = append(claimedIDs, id)
			return &Invitation{}, nil
		},
	}

	vehicles := &mockVehicleService{
		assignOwnershipFunc: func(_ context.Context, vehicleID, _ uuid.UUID) error {
			assignedVehicles = append(assignedVehicles, vehicleID)
			return nil
		},
	}

	svc := NewService(repo, vehicles, &mockMailer{})
	ownerID := uuid.New()

	err := svc.ClaimInvitations(context.Background(), "owner@test.com", ownerID)

	require.NoError(t, err)
	assert.Equal(t, []uuid.UUID{v1, v2}, assignedVehicles)
	assert.Equal(t, []uuid.UUID{inv1.ID, inv2.ID}, claimedIDs)
}

func TestService_ClaimInvitations_NoInvitations(t *testing.T) {
	repo := &mockRepo{
		getPendingInvitationsByEmailFunc: func(_ context.Context, _ string) ([]Invitation, error) {
			return nil, nil
		},
	}
	svc := NewService(repo, &mockVehicleService{}, &mockMailer{})

	err := svc.ClaimInvitations(context.Background(), "nobody@test.com", uuid.New())
	assert.NoError(t, err)
}

func TestService_GetInvitationsByToken_Success(t *testing.T) {
	email := "test@test.com"
	inv := &Invitation{ID: uuid.New(), Email: email}
	allInvitations := []Invitation{*inv, {ID: uuid.New(), Email: email}}

	repo := &mockRepo{
		getInvitationByTokenFunc: func(_ context.Context, _ string) (*Invitation, error) {
			return inv, nil
		},
		getPendingInvitationsByEmailFunc: func(_ context.Context, _ string) ([]Invitation, error) {
			return allInvitations, nil
		},
	}
	svc := NewService(repo, &mockVehicleService{}, &mockMailer{})

	invitations, gotEmail, err := svc.GetInvitationsByToken(context.Background(), "valid-token")

	require.NoError(t, err)
	assert.Equal(t, email, gotEmail)
	assert.Len(t, invitations, 2)
}

func TestService_GetInvitationsByToken_NotFound(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockVehicleService{}, &mockMailer{})

	_, _, err := svc.GetInvitationsByToken(context.Background(), "invalid-token")
	assert.ErrorIs(t, err, ErrInvitationNotFound)
}

func TestGetStringFromMap(t *testing.T) {
	m := map[string]interface{}{"make": "BMW", "year": 1970}
	assert.Equal(t, "BMW", getStringFromMap(m, "make"))
	assert.Equal(t, "", getStringFromMap(m, "missing"))
	assert.Equal(t, "", getStringFromMap(m, "year")) // wrong type
}

func TestGetIntFromMap(t *testing.T) {
	m := map[string]interface{}{
		"year_float": float64(1973),
		"year_int":   1974,
		"name":       "test",
	}
	assert.Equal(t, 1973, getIntFromMap(m, "year_float"))
	assert.Equal(t, 1974, getIntFromMap(m, "year_int"))
	assert.Equal(t, 0, getIntFromMap(m, "missing"))
	assert.Equal(t, 0, getIntFromMap(m, "name")) // wrong type
}

func TestService_CreateInvitation(t *testing.T) {
	var createdParams CreateInvitationParams
	repo := &mockRepo{
		createInvitationFunc: func(_ context.Context, params CreateInvitationParams) (*Invitation, error) {
			createdParams = params
			return &Invitation{ID: uuid.New()}, nil
		},
	}
	svc := NewService(repo, &mockVehicleService{}, &mockMailer{})

	vehicleID := uuid.New()
	err := svc.CreateInvitation(context.Background(), vehicleID, "user@test.com")
	require.NoError(t, err)
	assert.Equal(t, vehicleID, createdParams.VehicleID)
	assert.Equal(t, "user@test.com", createdParams.Email)
	assert.NotEmpty(t, createdParams.Token)
	assert.False(t, createdParams.TokenExpiresAt.IsZero())
}

func TestService_GetPendingInvitationsForEmail(t *testing.T) {
	expected := []Invitation{{ID: uuid.New(), Email: "user@test.com"}}
	repo := &mockRepo{
		getPendingInvitationsByEmailFunc: func(_ context.Context, _ string) ([]Invitation, error) {
			return expected, nil
		},
	}
	svc := NewService(repo, &mockVehicleService{}, &mockMailer{})

	result, err := svc.GetPendingInvitationsForEmail(context.Background(), "user@test.com")
	require.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestService_GetPendingInvitations(t *testing.T) {
	expected := []Invitation{{ID: uuid.New()}}
	repo := &mockRepo{}
	// Need a custom repo for GetAllPendingInvitations
	svc := NewService(&pendingRepo{mockRepo: *repo, invitations: expected}, &mockVehicleService{}, &mockMailer{})

	result, err := svc.GetPendingInvitations(context.Background())
	require.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestService_ValidateInvitationToken(t *testing.T) {
	expected := &Invitation{ID: uuid.New(), Email: "user@test.com"}
	repo := &mockRepo{
		getInvitationByTokenFunc: func(_ context.Context, _ string) (*Invitation, error) {
			return expected, nil
		},
	}
	svc := NewService(repo, &mockVehicleService{}, &mockMailer{})

	result, err := svc.ValidateInvitationToken(context.Background(), "token")
	require.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestService_GetPendingInvitationForVehicle(t *testing.T) {
	vehicleID := uuid.New()
	expected := &Invitation{ID: uuid.New(), VehicleID: vehicleID}
	svc := NewService(&vehiclePendingRepo{mockRepo: mockRepo{}, inv: expected}, &mockVehicleService{}, &mockMailer{})

	result, err := svc.GetPendingInvitationForVehicle(context.Background(), vehicleID)
	require.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestService_ClaimInvitations_OwnershipError(t *testing.T) {
	repo := &mockRepo{
		getPendingInvitationsByEmailFunc: func(_ context.Context, _ string) ([]Invitation, error) {
			return []Invitation{{ID: uuid.New(), VehicleID: uuid.New()}}, nil
		},
	}
	vehicles := &mockVehicleService{
		assignOwnershipFunc: func(_ context.Context, _, _ uuid.UUID) error {
			return errors.New("ownership error")
		},
	}
	svc := NewService(repo, vehicles, &mockMailer{})

	err := svc.ClaimInvitations(context.Background(), "user@test.com", uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "assign ownership")
}

func TestService_ClaimInvitations_ClaimError(t *testing.T) {
	repo := &mockRepo{
		getPendingInvitationsByEmailFunc: func(_ context.Context, _ string) ([]Invitation, error) {
			return []Invitation{{ID: uuid.New(), VehicleID: uuid.New()}}, nil
		},
		claimInvitationFunc: func(_ context.Context, _ uuid.UUID) (*Invitation, error) {
			return nil, errors.New("claim error")
		},
	}
	svc := NewService(repo, &mockVehicleService{}, &mockMailer{})

	err := svc.ClaimInvitations(context.Background(), "user@test.com", uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "claim invitation")
}

func TestService_ClaimInvitations_GetPendingError(t *testing.T) {
	repo := &mockRepo{
		getPendingInvitationsByEmailFunc: func(_ context.Context, _ string) ([]Invitation, error) {
			return nil, errors.New("db error")
		},
	}
	svc := NewService(repo, &mockVehicleService{}, &mockMailer{})

	err := svc.ClaimInvitations(context.Background(), "user@test.com", uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "get pending invitations")
}

func TestService_GetInvitationsByToken_GetPendingError(t *testing.T) {
	repo := &mockRepo{
		getInvitationByTokenFunc: func(_ context.Context, _ string) (*Invitation, error) {
			return &Invitation{Email: "user@test.com"}, nil
		},
		getPendingInvitationsByEmailFunc: func(_ context.Context, _ string) ([]Invitation, error) {
			return nil, errors.New("db error")
		},
	}
	svc := NewService(repo, &mockVehicleService{}, &mockMailer{})

	_, _, err := svc.GetInvitationsByToken(context.Background(), "token")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "get invitations")
}

func TestService_GetInvitationsByToken_NonNotFoundError(t *testing.T) {
	repo := &mockRepo{
		getInvitationByTokenFunc: func(_ context.Context, _ string) (*Invitation, error) {
			return nil, errors.New("unexpected db error")
		},
	}
	svc := NewService(repo, &mockVehicleService{}, &mockMailer{})

	_, _, err := svc.GetInvitationsByToken(context.Background(), "token")
	assert.Error(t, err)
	assert.NotErrorIs(t, err, ErrInvitationNotFound)
	assert.Contains(t, err.Error(), "failed to get invitation by token")
}

// --- OnRegistrationComplete tests ---

func TestService_OnRegistrationComplete_Success(t *testing.T) {
	claimCalled := false
	repo := &mockRepo{
		getPendingInvitationsByEmailFunc: func(_ context.Context, email string) ([]Invitation, error) {
			assert.Equal(t, "new@user.com", email)
			claimCalled = true
			return nil, nil
		},
	}
	svc := NewService(repo, &mockVehicleService{}, &mockMailer{})

	identity := &kratos.Identity{
		Traits: map[string]interface{}{"email": "new@user.com"},
	}
	err := svc.OnRegistrationComplete(uuid.New(), identity)
	require.NoError(t, err)
	assert.True(t, claimCalled)
}

func TestService_OnRegistrationComplete_NilIdentity(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockVehicleService{}, &mockMailer{})

	err := svc.OnRegistrationComplete(uuid.New(), nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid identity")
}

func TestService_OnRegistrationComplete_NilTraits(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockVehicleService{}, &mockMailer{})

	identity := &kratos.Identity{Traits: nil}
	err := svc.OnRegistrationComplete(uuid.New(), identity)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid identity")
}

func TestService_OnRegistrationComplete_InvalidTraitsFormat(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockVehicleService{}, &mockMailer{})

	identity := &kratos.Identity{Traits: "not a map"}
	err := svc.OnRegistrationComplete(uuid.New(), identity)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid traits format")
}

func TestService_OnRegistrationComplete_NoEmail(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockVehicleService{}, &mockMailer{})

	identity := &kratos.Identity{
		Traits: map[string]interface{}{"name": "John"},
	}
	err := svc.OnRegistrationComplete(uuid.New(), identity)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "email not found")
}

func TestService_OnRegistrationComplete_EmptyEmail(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockVehicleService{}, &mockMailer{})

	identity := &kratos.Identity{
		Traits: map[string]interface{}{"email": ""},
	}
	err := svc.OnRegistrationComplete(uuid.New(), identity)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "email not found")
}

func TestNewRegistrationCompleteMiddleware(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockVehicleService{}, &mockMailer{})
	mw := NewRegistrationCompleteMiddleware(svc)
	assert.NotNil(t, mw)

	// WrapHandler delegates to OnRegistrationComplete
	err := mw.WrapHandler(uuid.New(), nil)
	assert.Error(t, err) // nil identity
}

// --- Helper repo types for delegation tests ---

type pendingRepo struct {
	mockRepo
	invitations []Invitation
}

func (r *pendingRepo) GetAllPendingInvitations(_ context.Context) ([]Invitation, error) {
	return r.invitations, nil
}

type vehiclePendingRepo struct {
	mockRepo
	inv *Invitation
}

func (r *vehiclePendingRepo) GetPendingInvitationByVehicleID(_ context.Context, _ uuid.UUID) (*Invitation, error) {
	return r.inv, nil
}
