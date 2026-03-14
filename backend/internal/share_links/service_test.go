package share_links

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
	createFunc          func(ctx context.Context, params CreateShareLinkParams) (*ShareLink, error)
	getByTokenFunc      func(ctx context.Context, token string) (*ShareLink, error)
	incrementAccessFunc func(ctx context.Context, id uuid.UUID) error
	listByVehicleFunc   func(ctx context.Context, vehicleID uuid.UUID) ([]ShareLink, error)
	revokeFunc          func(ctx context.Context, id uuid.UUID) (*ShareLink, error)
}

func (m *mockRepo) Create(ctx context.Context, params CreateShareLinkParams) (*ShareLink, error) {
	if m.createFunc != nil {
		return m.createFunc(ctx, params)
	}
	return &ShareLink{ID: uuid.New(), VehicleID: params.VehicleID, Token: "token"}, nil
}
func (m *mockRepo) GetByToken(ctx context.Context, token string) (*ShareLink, error) {
	if m.getByTokenFunc != nil {
		return m.getByTokenFunc(ctx, token)
	}
	return nil, nil
}
func (m *mockRepo) GetByID(ctx context.Context, id uuid.UUID) (*ShareLink, error) {
	return nil, nil
}
func (m *mockRepo) ListByVehicle(ctx context.Context, vehicleID uuid.UUID) ([]ShareLink, error) {
	if m.listByVehicleFunc != nil {
		return m.listByVehicleFunc(ctx, vehicleID)
	}
	return nil, nil
}
func (m *mockRepo) IncrementAccessCount(ctx context.Context, id uuid.UUID) error {
	if m.incrementAccessFunc != nil {
		return m.incrementAccessFunc(ctx, id)
	}
	return nil
}
func (m *mockRepo) Revoke(ctx context.Context, id uuid.UUID) (*ShareLink, error) {
	if m.revokeFunc != nil {
		return m.revokeFunc(ctx, id)
	}
	return &ShareLink{}, nil
}

// --- Tests ---

func TestService_CreateShareLink_ValidDurations(t *testing.T) {
	svc := NewService(&mockRepo{})

	durations := []string{"1h", "24h", "7d", "30d"}
	for _, d := range durations {
		t.Run(d, func(t *testing.T) {
			result, err := svc.CreateShareLink(context.Background(), CreateShareLinkParams{
				VehicleID: uuid.New(),
				Duration:  d,
			})
			require.NoError(t, err)
			assert.NotNil(t, result)
		})
	}
}

func TestService_CreateShareLink_InvalidDuration(t *testing.T) {
	svc := NewService(&mockRepo{})

	_, err := svc.CreateShareLink(context.Background(), CreateShareLinkParams{
		VehicleID: uuid.New(),
		Duration:  "invalid",
	})
	assert.ErrorIs(t, err, ErrInvalidDuration)
}

func TestService_GetSharedVehicleData_Success(t *testing.T) {
	linkID := uuid.New()
	incrementCalled := false

	repo := &mockRepo{
		getByTokenFunc: func(_ context.Context, _ string) (*ShareLink, error) {
			return &ShareLink{
				ID:        linkID,
				ExpiresAt: time.Now().Add(24 * time.Hour),
				RevokedAt: nil,
			}, nil
		},
		incrementAccessFunc: func(_ context.Context, id uuid.UUID) error {
			incrementCalled = true
			assert.Equal(t, linkID, id)
			return nil
		},
	}
	svc := NewService(repo)

	result, err := svc.GetSharedVehicleData(context.Background(), "valid-token")
	require.NoError(t, err)
	assert.Equal(t, linkID, result.ID)
	assert.True(t, incrementCalled)
}

func TestService_GetSharedVehicleData_NotFound(t *testing.T) {
	svc := NewService(&mockRepo{})

	_, err := svc.GetSharedVehicleData(context.Background(), "missing")
	assert.ErrorIs(t, err, ErrShareLinkNotFound)
}

func TestService_GetSharedVehicleData_Expired(t *testing.T) {
	repo := &mockRepo{
		getByTokenFunc: func(_ context.Context, _ string) (*ShareLink, error) {
			return &ShareLink{
				ID:        uuid.New(),
				ExpiresAt: time.Now().Add(-1 * time.Hour),
			}, nil
		},
	}
	svc := NewService(repo)

	_, err := svc.GetSharedVehicleData(context.Background(), "expired-token")
	assert.ErrorIs(t, err, ErrShareLinkExpired)
}

func TestService_GetSharedVehicleData_Revoked(t *testing.T) {
	now := time.Now()
	repo := &mockRepo{
		getByTokenFunc: func(_ context.Context, _ string) (*ShareLink, error) {
			return &ShareLink{
				ID:        uuid.New(),
				ExpiresAt: time.Now().Add(24 * time.Hour),
				RevokedAt: &now,
			}, nil
		},
	}
	svc := NewService(repo)

	_, err := svc.GetSharedVehicleData(context.Background(), "revoked-token")
	assert.ErrorIs(t, err, ErrShareLinkRevoked)
}

func TestParseExpirsDuration(t *testing.T) {
	tests := []struct {
		duration string
		wantErr  bool
		minDelta time.Duration
		maxDelta time.Duration
	}{
		{"1h", false, 59 * time.Minute, 61 * time.Minute},
		{"24h", false, 23 * time.Hour, 25 * time.Hour},
		{"7d", false, 167 * time.Hour, 169 * time.Hour},
		{"30d", false, 719 * time.Hour, 721 * time.Hour},
		{"invalid", true, 0, 0},
		{"", true, 0, 0},
		{"2h", true, 0, 0},
	}

	for _, tt := range tests {
		t.Run(tt.duration, func(t *testing.T) {
			before := time.Now()
			result, err := parseExpirsDuration(tt.duration)

			if tt.wantErr {
				assert.ErrorIs(t, err, ErrInvalidDuration)
				return
			}

			require.NoError(t, err)
			delta := result.Sub(before)
			assert.True(t, delta >= tt.minDelta && delta <= tt.maxDelta,
				"delta %v not in range [%v, %v]", delta, tt.minDelta, tt.maxDelta)
		})
	}
}

func TestShareLink_IsExpired(t *testing.T) {
	assert.True(t, (&ShareLink{ExpiresAt: time.Now().Add(-time.Hour)}).IsExpired())
	assert.False(t, (&ShareLink{ExpiresAt: time.Now().Add(time.Hour)}).IsExpired())
}

func TestShareLink_IsRevoked(t *testing.T) {
	now := time.Now()
	assert.True(t, (&ShareLink{RevokedAt: &now}).IsRevoked())
	assert.False(t, (&ShareLink{RevokedAt: nil}).IsRevoked())
}

func TestShareLink_IsActive(t *testing.T) {
	active := &ShareLink{ExpiresAt: time.Now().Add(time.Hour), RevokedAt: nil}
	assert.True(t, active.IsActive())

	expired := &ShareLink{ExpiresAt: time.Now().Add(-time.Hour), RevokedAt: nil}
	assert.False(t, expired.IsActive())

	now := time.Now()
	revoked := &ShareLink{ExpiresAt: time.Now().Add(time.Hour), RevokedAt: &now}
	assert.False(t, revoked.IsActive())
}

func TestShareLink_GetPermissions(t *testing.T) {
	sl := &ShareLink{
		CanViewDetails:   true,
		CanViewPhotos:    false,
		CanViewDocuments: true,
		CanViewHistory:   false,
	}

	perms := sl.GetPermissions()
	assert.True(t, perms.CanViewDetails)
	assert.False(t, perms.CanViewPhotos)
	assert.True(t, perms.CanViewDocuments)
	assert.False(t, perms.CanViewHistory)
}

func TestService_RevokeShareLink(t *testing.T) {
	linkID := uuid.New()
	revokedAt := time.Now()

	repo := &mockRepo{
		revokeFunc: func(_ context.Context, id uuid.UUID) (*ShareLink, error) {
			return &ShareLink{ID: id, RevokedAt: &revokedAt}, nil
		},
	}
	svc := NewService(repo)

	result, err := svc.RevokeShareLink(context.Background(), linkID)
	require.NoError(t, err)
	assert.Equal(t, linkID, result.ID)
	assert.NotNil(t, result.RevokedAt)
}

func TestService_ListShareLinks(t *testing.T) {
	vehicleID := uuid.New()
	expected := []ShareLink{{ID: uuid.New(), VehicleID: vehicleID}}

	repo := &mockRepo{
		listByVehicleFunc: func(_ context.Context, _ uuid.UUID) ([]ShareLink, error) {
			return expected, nil
		},
	}
	svc := NewService(repo)

	result, err := svc.ListShareLinks(context.Background(), vehicleID)
	require.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestService_CreateShareLink_RepoError(t *testing.T) {
	repo := &mockRepo{
		createFunc: func(_ context.Context, _ CreateShareLinkParams) (*ShareLink, error) {
			return nil, assert.AnError
		},
	}
	svc := NewService(repo)

	_, err := svc.CreateShareLink(context.Background(), CreateShareLinkParams{
		VehicleID: uuid.New(),
		Duration:  "1h",
	})
	assert.Error(t, err)
}

func TestService_GetSharedVehicleData_RepoError(t *testing.T) {
	repo := &mockRepo{
		getByTokenFunc: func(_ context.Context, _ string) (*ShareLink, error) {
			return nil, assert.AnError
		},
	}
	svc := NewService(repo)

	_, err := svc.GetSharedVehicleData(context.Background(), "token")
	assert.Error(t, err)
}

func TestService_GetSharedVehicleData_IncrementError(t *testing.T) {
	repo := &mockRepo{
		getByTokenFunc: func(_ context.Context, _ string) (*ShareLink, error) {
			return &ShareLink{
				ID:        uuid.New(),
				ExpiresAt: time.Now().Add(time.Hour),
			}, nil
		},
		incrementAccessFunc: func(_ context.Context, _ uuid.UUID) error {
			return assert.AnError
		},
	}
	svc := NewService(repo)

	_, err := svc.GetSharedVehicleData(context.Background(), "token")
	assert.Error(t, err)
}

func TestGenerateShareToken(t *testing.T) {
	token, err := GenerateShareToken()
	require.NoError(t, err)
	assert.NotEmpty(t, token)

	token2, err := GenerateShareToken()
	require.NoError(t, err)
	assert.NotEqual(t, token, token2)
}
