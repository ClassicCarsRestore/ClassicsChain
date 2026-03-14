package user

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/s1moe2/classics-chain/pkg/kratos"
	"github.com/s1moe2/classics-chain/user_invitation"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// --- Mocks ---

type mockRepo struct {
	getByIDFunc                func(ctx context.Context, id uuid.UUID) (*User, error)
	createFunc                 func(ctx context.Context, user *User) error
	getUserEntityMembershipsFunc func(ctx context.Context, userID uuid.UUID) ([]EntityMembership, error)
	getUserEntityRoleFunc      func(ctx context.Context, userID, entityID uuid.UUID) (string, error)
}

func (m *mockRepo) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	if m.getByIDFunc != nil {
		return m.getByIDFunc(ctx, id)
	}
	return nil, ErrUserNotFound
}
func (m *mockRepo) Create(ctx context.Context, user *User) error {
	if m.createFunc != nil {
		return m.createFunc(ctx, user)
	}
	return nil
}
func (m *mockRepo) GetUserEntityMemberships(ctx context.Context, userID uuid.UUID) ([]EntityMembership, error) {
	if m.getUserEntityMembershipsFunc != nil {
		return m.getUserEntityMembershipsFunc(ctx, userID)
	}
	return nil, nil
}
func (m *mockRepo) AddUserToEntity(ctx context.Context, userID, entityID uuid.UUID, role string) error {
	return nil
}
func (m *mockRepo) GetUserEntityRole(ctx context.Context, userID, entityID uuid.UUID) (string, error) {
	if m.getUserEntityRoleFunc != nil {
		return m.getUserEntityRoleFunc(ctx, userID, entityID)
	}
	return "", errors.New("not a member")
}

type mockKratos struct {
	listAdminUsersFunc func(ctx context.Context) ([]kratos.UserIdentity, error)
	getUserFunc        func(ctx context.Context, userID string) (*kratos.UserIdentity, error)
	getUserByEmailFunc func(ctx context.Context, email string) (*kratos.UserIdentity, error)
	updateUserFunc     func(ctx context.Context, userID string, params kratos.UpdateUserParams) (*kratos.UserIdentity, error)
	createUserFunc     func(ctx context.Context, params kratos.CreateUserParams) (*kratos.UserIdentity, error)
}

func (m *mockKratos) ListAdminUsers(ctx context.Context) ([]kratos.UserIdentity, error) {
	if m.listAdminUsersFunc != nil {
		return m.listAdminUsersFunc(ctx)
	}
	return nil, nil
}
func (m *mockKratos) GetUser(ctx context.Context, userID string) (*kratos.UserIdentity, error) {
	if m.getUserFunc != nil {
		return m.getUserFunc(ctx, userID)
	}
	return nil, errors.New("not found")
}
func (m *mockKratos) GetUserByEmail(ctx context.Context, email string) (*kratos.UserIdentity, error) {
	if m.getUserByEmailFunc != nil {
		return m.getUserByEmailFunc(ctx, email)
	}
	return nil, nil
}
func (m *mockKratos) CreateUser(ctx context.Context, params kratos.CreateUserParams) (*kratos.UserIdentity, error) {
	if m.createUserFunc != nil {
		return m.createUserFunc(ctx, params)
	}
	return &kratos.UserIdentity{ID: uuid.New().String()}, nil
}
func (m *mockKratos) UpdateUser(ctx context.Context, userID string, params kratos.UpdateUserParams) (*kratos.UserIdentity, error) {
	if m.updateUserFunc != nil {
		return m.updateUserFunc(ctx, userID, params)
	}
	return &kratos.UserIdentity{ID: userID}, nil
}

type mockInvitationService struct {
	getPendingFunc func(ctx context.Context, email string) ([]interface{}, error)
}

func (m *mockInvitationService) GetPendingInvitationsForEmail(ctx context.Context, email string) ([]interface{}, error) {
	if m.getPendingFunc != nil {
		return m.getPendingFunc(ctx, email)
	}
	return nil, nil
}

type mockVehicleService struct {
	getByIDFunc func(ctx context.Context, id uuid.UUID) (interface{}, error)
}

func (m *mockVehicleService) GetByID(ctx context.Context, id uuid.UUID) (interface{}, error) {
	if m.getByIDFunc != nil {
		return m.getByIDFunc(ctx, id)
	}
	return nil, nil
}

type mockUserInvitationService struct {
	createAdminInvitationFunc func(ctx context.Context, params user_invitation.CreateAdminInvitationParams) (*user_invitation.UserInvitation, error)
}

func (m *mockUserInvitationService) CreateAdminInvitation(ctx context.Context, params user_invitation.CreateAdminInvitationParams) (*user_invitation.UserInvitation, error) {
	if m.createAdminInvitationFunc != nil {
		return m.createAdminInvitationFunc(ctx, params)
	}
	return &user_invitation.UserInvitation{}, nil
}

// --- Tests ---

func ptr[T any](v T) *T { return &v }

func TestService_ListAdminUsers_Pagination(t *testing.T) {
	id1 := uuid.New()
	id2 := uuid.New()
	id3 := uuid.New()

	mk := &mockKratos{
		listAdminUsersFunc: func(_ context.Context) ([]kratos.UserIdentity, error) {
			return []kratos.UserIdentity{
				{ID: id1.String(), Email: "a@test.com"},
				{ID: id2.String(), Email: "b@test.com"},
				{ID: id3.String(), Email: "c@test.com"},
			}, nil
		},
	}
	svc := New(&mockRepo{}, mk)

	tests := []struct {
		name          string
		limit, offset int
		wantCount     int
		wantTotal     int
	}{
		{"first page", 2, 0, 2, 3},
		{"second page", 2, 2, 1, 3},
		{"offset beyond total", 10, 5, 0, 3},
		{"negative offset clamped", 10, -1, 3, 3},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			users, total, err := svc.ListAdminUsers(context.Background(), tt.limit, tt.offset)
			require.NoError(t, err)
			assert.Len(t, users, tt.wantCount)
			assert.Equal(t, tt.wantTotal, total)
		})
	}
}

func TestService_ListAdminUsers_SkipsInvalidUUID(t *testing.T) {
	mk := &mockKratos{
		listAdminUsersFunc: func(_ context.Context) ([]kratos.UserIdentity, error) {
			return []kratos.UserIdentity{
				{ID: "not-a-uuid", Email: "bad@test.com"},
				{ID: uuid.New().String(), Email: "good@test.com"},
			}, nil
		},
	}
	svc := New(&mockRepo{}, mk)

	users, total, err := svc.ListAdminUsers(context.Background(), 10, 0)
	require.NoError(t, err)
	assert.Len(t, users, 1)
	assert.Equal(t, 1, total)
}

func TestService_ListAdminUsers_NilKratos(t *testing.T) {
	svc := New(&mockRepo{}, nil)
	_, _, err := svc.ListAdminUsers(context.Background(), 10, 0)
	assert.Error(t, err)
}

func TestService_CreateOrGetUser_ExistingUser(t *testing.T) {
	userID := uuid.New()
	existing := &User{ID: userID, IsAdmin: true}

	svc := New(&mockRepo{
		getByIDFunc: func(_ context.Context, id uuid.UUID) (*User, error) {
			if id == userID {
				return existing, nil
			}
			return nil, ErrUserNotFound
		},
	}, &mockKratos{})

	result, err := svc.CreateOrGetUser(context.Background(), userID.String())
	require.NoError(t, err)
	assert.Equal(t, existing, result)
}

func TestService_CreateOrGetUser_CreatesNew(t *testing.T) {
	var createdUser *User
	svc := New(&mockRepo{
		createFunc: func(_ context.Context, u *User) error {
			createdUser = u
			return nil
		},
	}, &mockKratos{})

	userID := uuid.New()
	result, err := svc.CreateOrGetUser(context.Background(), userID.String())
	require.NoError(t, err)
	assert.Equal(t, userID, result.ID)
	assert.False(t, result.IsAdmin)
	assert.Equal(t, createdUser, result)
}

func TestService_CreateOrGetUser_InvalidUUID(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{})

	_, err := svc.CreateOrGetUser(context.Background(), "not-a-uuid")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "parse identity ID")
}

func TestService_GetAdminUserWithTraits_Success(t *testing.T) {
	userID := uuid.New()
	svc := New(&mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*User, error) {
			return &User{ID: userID, IsAdmin: true}, nil
		},
	}, &mockKratos{
		getUserFunc: func(_ context.Context, _ string) (*kratos.UserIdentity, error) {
			return &kratos.UserIdentity{ID: userID.String(), Email: "admin@test.com", Name: ptr("Admin")}, nil
		},
	})

	result, err := svc.GetAdminUserWithTraits(context.Background(), userID)
	require.NoError(t, err)
	assert.Equal(t, "admin@test.com", result.Email)
	assert.Equal(t, ptr("Admin"), result.Name)
}

func TestService_GetAdminUserWithTraits_NotFound(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{})

	_, err := svc.GetAdminUserWithTraits(context.Background(), uuid.New())
	assert.Error(t, err)
}

func TestService_GetAdminUserWithTraits_NotAdmin(t *testing.T) {
	userID := uuid.New()
	svc := New(&mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*User, error) {
			return &User{ID: userID, IsAdmin: false}, nil
		},
	}, &mockKratos{})

	_, err := svc.GetAdminUserWithTraits(context.Background(), userID)
	assert.ErrorIs(t, err, ErrUserNotAdmin)
}

func TestService_RemoveAdminPrivileges_Success(t *testing.T) {
	userID := uuid.New()
	var updatedParams kratos.UpdateUserParams

	svc := New(&mockRepo{}, &mockKratos{
		getUserFunc: func(_ context.Context, _ string) (*kratos.UserIdentity, error) {
			return &kratos.UserIdentity{ID: userID.String(), IsAdmin: true}, nil
		},
		updateUserFunc: func(_ context.Context, _ string, params kratos.UpdateUserParams) (*kratos.UserIdentity, error) {
			updatedParams = params
			return &kratos.UserIdentity{}, nil
		},
	})

	err := svc.RemoveAdminPrivileges(context.Background(), userID)
	require.NoError(t, err)
	require.NotNil(t, updatedParams.IsAdmin)
	assert.False(t, *updatedParams.IsAdmin)
}

func TestService_RemoveAdminPrivileges_NotAdmin(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{
		getUserFunc: func(_ context.Context, _ string) (*kratos.UserIdentity, error) {
			return &kratos.UserIdentity{IsAdmin: false}, nil
		},
	})

	err := svc.RemoveAdminPrivileges(context.Background(), uuid.New())
	assert.ErrorIs(t, err, ErrUserNotAdmin)
}

func TestService_GetUserProfile_WithMembershipsAndInvitations(t *testing.T) {
	userID := uuid.New()
	entityID := uuid.New()
	vehicleID := uuid.New()

	svc := New(&mockRepo{
		getUserEntityMembershipsFunc: func(_ context.Context, _ uuid.UUID) ([]EntityMembership, error) {
			return []EntityMembership{{UserID: userID, EntityID: entityID, Role: "admin"}}, nil
		},
	}, &mockKratos{})
	svc.invitationService = &mockInvitationService{
		getPendingFunc: func(_ context.Context, _ string) ([]interface{}, error) {
			return []interface{}{
				map[string]interface{}{"vehicle_id": vehicleID},
			}, nil
		},
	}
	svc.vehicleService = &mockVehicleService{
		getByIDFunc: func(_ context.Context, id uuid.UUID) (interface{}, error) {
			return map[string]string{"id": id.String(), "make": "Porsche"}, nil
		},
	}

	result, err := svc.GetUserProfile(context.Background(), userID, "user@test.com")
	require.NoError(t, err)
	assert.Len(t, result.EntityMemberships, 1)
	assert.Len(t, result.PendingInvitationVehicles, 1)
}

func TestService_GetUserProfile_Deduplication(t *testing.T) {
	userID := uuid.New()
	vehicleID := uuid.New()

	svc := New(&mockRepo{}, &mockKratos{})
	svc.invitationService = &mockInvitationService{
		getPendingFunc: func(_ context.Context, _ string) ([]interface{}, error) {
			return []interface{}{
				map[string]interface{}{"vehicle_id": vehicleID},
				map[string]interface{}{"vehicle_id": vehicleID}, // duplicate
			}, nil
		},
	}
	svc.vehicleService = &mockVehicleService{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (interface{}, error) {
			return "vehicle-data", nil
		},
	}

	result, err := svc.GetUserProfile(context.Background(), userID, "user@test.com")
	require.NoError(t, err)
	assert.Len(t, result.PendingInvitationVehicles, 1)
}

func TestService_GetUserProfile_NilServices(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{})

	result, err := svc.GetUserProfile(context.Background(), uuid.New(), "user@test.com")
	require.NoError(t, err)
	assert.Empty(t, result.EntityMemberships)
	assert.Empty(t, result.PendingInvitationVehicles)
}

func TestService_GetUserProfile_EmptyEmail(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{})
	svc.invitationService = &mockInvitationService{}
	svc.vehicleService = &mockVehicleService{}

	result, err := svc.GetUserProfile(context.Background(), uuid.New(), "")
	require.NoError(t, err)
	assert.Empty(t, result.PendingInvitationVehicles)
}

func TestService_CreateAdminInvitation_Success(t *testing.T) {
	var calledParams user_invitation.CreateAdminInvitationParams
	svc := New(&mockRepo{}, &mockKratos{})
	svc.SetUserInvitationService(&mockUserInvitationService{
		createAdminInvitationFunc: func(_ context.Context, params user_invitation.CreateAdminInvitationParams) (*user_invitation.UserInvitation, error) {
			calledParams = params
			return &user_invitation.UserInvitation{}, nil
		},
	})

	err := svc.CreateAdminInvitation(context.Background(), "new@admin.com", ptr("New Admin"))
	require.NoError(t, err)
	assert.Equal(t, "new@admin.com", calledParams.Email)
	assert.Equal(t, ptr("New Admin"), calledParams.Name)
}

func TestService_CreateAdminInvitation_NilService(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{})

	err := svc.CreateAdminInvitation(context.Background(), "new@admin.com", nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not configured")
}

func TestService_CreateAdminInvitation_Error(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{})
	svc.SetUserInvitationService(&mockUserInvitationService{
		createAdminInvitationFunc: func(_ context.Context, _ user_invitation.CreateAdminInvitationParams) (*user_invitation.UserInvitation, error) {
			return nil, errors.New("db error")
		},
	})

	err := svc.CreateAdminInvitation(context.Background(), "x@test.com", nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "create admin invitation")
}

func TestService_GetUserByEmail_Success(t *testing.T) {
	userID := uuid.New()
	svc := New(&mockRepo{}, &mockKratos{
		getUserByEmailFunc: func(_ context.Context, _ string) (*kratos.UserIdentity, error) {
			return &kratos.UserIdentity{ID: userID.String(), Email: "user@test.com"}, nil
		},
	})

	result, err := svc.GetUserByEmail(context.Background(), "user@test.com")
	require.NoError(t, err)
	require.NotNil(t, result)
	assert.Equal(t, userID, *result)
}

func TestService_GetUserByEmail_NotFound(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{
		getUserByEmailFunc: func(_ context.Context, _ string) (*kratos.UserIdentity, error) {
			return nil, nil
		},
	})

	result, err := svc.GetUserByEmail(context.Background(), "nobody@test.com")
	require.NoError(t, err)
	assert.Nil(t, result)
}

func TestService_GetUserByEmail_NilKratos(t *testing.T) {
	svc := New(&mockRepo{}, nil)

	_, err := svc.GetUserByEmail(context.Background(), "user@test.com")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "kratos client not configured")
}

func TestService_GetUserByEmail_KratosError(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{
		getUserByEmailFunc: func(_ context.Context, _ string) (*kratos.UserIdentity, error) {
			return nil, errors.New("kratos error")
		},
	})

	_, err := svc.GetUserByEmail(context.Background(), "user@test.com")
	assert.Error(t, err)
}

func TestService_GetUserByEmail_InvalidUUID(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{
		getUserByEmailFunc: func(_ context.Context, _ string) (*kratos.UserIdentity, error) {
			return &kratos.UserIdentity{ID: "not-a-uuid"}, nil
		},
	})

	_, err := svc.GetUserByEmail(context.Background(), "user@test.com")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "parse user ID")
}

func TestService_GetUserEntityMemberships(t *testing.T) {
	userID := uuid.New()
	expected := []EntityMembership{{UserID: userID, EntityID: uuid.New(), Role: "admin"}}

	svc := New(&mockRepo{
		getUserEntityMembershipsFunc: func(_ context.Context, _ uuid.UUID) ([]EntityMembership, error) {
			return expected, nil
		},
	}, &mockKratos{})

	result, err := svc.GetUserEntityMemberships(context.Background(), userID)
	require.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestService_GetUserEntityRole(t *testing.T) {
	svc := New(&mockRepo{
		getUserEntityRoleFunc: func(_ context.Context, _, _ uuid.UUID) (string, error) {
			return "admin", nil
		},
	}, &mockKratos{})

	role, err := svc.GetUserEntityRole(context.Background(), uuid.New(), uuid.New())
	require.NoError(t, err)
	assert.Equal(t, "admin", role)
}

func TestService_CreateOrGetUser_CreateError(t *testing.T) {
	svc := New(&mockRepo{
		createFunc: func(_ context.Context, _ *User) error {
			return errors.New("db error")
		},
	}, &mockKratos{})

	_, err := svc.CreateOrGetUser(context.Background(), uuid.New().String())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "create user")
}

func TestService_CreateOrGetUser_RepoError(t *testing.T) {
	svc := New(&mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*User, error) {
			return nil, errors.New("unexpected db error")
		},
	}, &mockKratos{})

	_, err := svc.CreateOrGetUser(context.Background(), uuid.New().String())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "check user existence")
}

func TestService_GetAdminUserWithTraits_NilKratos(t *testing.T) {
	svc := New(&mockRepo{}, nil)
	_, err := svc.GetAdminUserWithTraits(context.Background(), uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "kratos client not configured")
}

func TestService_GetAdminUserWithTraits_NilDBUser(t *testing.T) {
	svc := New(&mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*User, error) {
			return nil, nil
		},
	}, &mockKratos{})

	_, err := svc.GetAdminUserWithTraits(context.Background(), uuid.New())
	assert.ErrorIs(t, err, ErrUserNotFound)
}

func TestService_GetAdminUserWithTraits_KratosError(t *testing.T) {
	userID := uuid.New()
	svc := New(&mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*User, error) {
			return &User{ID: userID, IsAdmin: true}, nil
		},
	}, &mockKratos{
		getUserFunc: func(_ context.Context, _ string) (*kratos.UserIdentity, error) {
			return nil, errors.New("kratos error")
		},
	})

	_, err := svc.GetAdminUserWithTraits(context.Background(), userID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "get user from kratos")
}

func TestService_RemoveAdminPrivileges_NilKratos(t *testing.T) {
	svc := New(&mockRepo{}, nil)
	err := svc.RemoveAdminPrivileges(context.Background(), uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "kratos client not configured")
}

func TestService_RemoveAdminPrivileges_GetUserError(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{
		getUserFunc: func(_ context.Context, _ string) (*kratos.UserIdentity, error) {
			return nil, errors.New("kratos error")
		},
	})

	err := svc.RemoveAdminPrivileges(context.Background(), uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "get user from kratos")
}

func TestService_RemoveAdminPrivileges_UpdateError(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{
		getUserFunc: func(_ context.Context, _ string) (*kratos.UserIdentity, error) {
			return &kratos.UserIdentity{IsAdmin: true}, nil
		},
		updateUserFunc: func(_ context.Context, _ string, _ kratos.UpdateUserParams) (*kratos.UserIdentity, error) {
			return nil, errors.New("update error")
		},
	})

	err := svc.RemoveAdminPrivileges(context.Background(), uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "update user in kratos")
}

func TestService_ListAdminUsers_KratosError(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{
		listAdminUsersFunc: func(_ context.Context) ([]kratos.UserIdentity, error) {
			return nil, errors.New("kratos error")
		},
	})

	_, _, err := svc.ListAdminUsers(context.Background(), 10, 0)
	assert.Error(t, err)
}

func TestService_GetUserProfile_VehicleIDAsString(t *testing.T) {
	vehicleID := uuid.New()

	svc := New(&mockRepo{}, &mockKratos{})
	svc.invitationService = &mockInvitationService{
		getPendingFunc: func(_ context.Context, _ string) ([]interface{}, error) {
			return []interface{}{
				map[string]interface{}{"vehicle_id": vehicleID.String()},
			}, nil
		},
	}
	svc.vehicleService = &mockVehicleService{
		getByIDFunc: func(_ context.Context, id uuid.UUID) (interface{}, error) {
			return "vehicle-data", nil
		},
	}

	result, err := svc.GetUserProfile(context.Background(), uuid.New(), "user@test.com")
	require.NoError(t, err)
	assert.Len(t, result.PendingInvitationVehicles, 1)
}

func TestService_GetUserProfile_InvalidInvitationFormat(t *testing.T) {
	svc := New(&mockRepo{}, &mockKratos{})
	svc.invitationService = &mockInvitationService{
		getPendingFunc: func(_ context.Context, _ string) ([]interface{}, error) {
			return []interface{}{
				"not a map",
				map[string]interface{}{},                     // no vehicle_id
				map[string]interface{}{"vehicle_id": 12345},  // wrong type
				map[string]interface{}{"vehicle_id": "bad!!"}, // unparseable string
			}, nil
		},
	}
	svc.vehicleService = &mockVehicleService{}

	result, err := svc.GetUserProfile(context.Background(), uuid.New(), "user@test.com")
	require.NoError(t, err)
	assert.Empty(t, result.PendingInvitationVehicles)
}

func TestService_GetUserProfile_VehicleFetchError(t *testing.T) {
	vehicleID := uuid.New()

	svc := New(&mockRepo{}, &mockKratos{})
	svc.invitationService = &mockInvitationService{
		getPendingFunc: func(_ context.Context, _ string) ([]interface{}, error) {
			return []interface{}{
				map[string]interface{}{"vehicle_id": vehicleID},
			}, nil
		},
	}
	svc.vehicleService = &mockVehicleService{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (interface{}, error) {
			return nil, errors.New("not found")
		},
	}

	result, err := svc.GetUserProfile(context.Background(), uuid.New(), "user@test.com")
	require.NoError(t, err)
	assert.Empty(t, result.PendingInvitationVehicles) // skips on error
}
