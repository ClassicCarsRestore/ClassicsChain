package entity

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ClassicCarsRestore/ClassicsChain/auth"
	"github.com/ClassicCarsRestore/ClassicsChain/pkg/hydra"
	"github.com/ClassicCarsRestore/ClassicsChain/pkg/kratos"
	"github.com/ClassicCarsRestore/ClassicsChain/user"
	"github.com/ClassicCarsRestore/ClassicsChain/user_invitation"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// --- Mocks ---

type mockRepo struct {
	getByIDFunc    func(ctx context.Context, id uuid.UUID) (*Entity, error)
	createFunc     func(ctx context.Context, entity *Entity) error
	updateFunc     func(ctx context.Context, entity *Entity) error
	deleteFunc     func(ctx context.Context, id uuid.UUID) error
	updateLogoFunc func(ctx context.Context, id uuid.UUID, objectKey string) (*Entity, error)
	clearLogoFunc  func(ctx context.Context, id uuid.UUID) error
}

func (m *mockRepo) GetAll(ctx context.Context, limit, offset int, entityType *EntityType) ([]Entity, int, error) {
	return nil, 0, nil
}
func (m *mockRepo) GetByID(ctx context.Context, id uuid.UUID) (*Entity, error) {
	if m.getByIDFunc != nil {
		return m.getByIDFunc(ctx, id)
	}
	return nil, ErrEntityNotFound
}
func (m *mockRepo) Create(ctx context.Context, entity *Entity) error {
	if m.createFunc != nil {
		return m.createFunc(ctx, entity)
	}
	return nil
}
func (m *mockRepo) Update(ctx context.Context, entity *Entity) error {
	if m.updateFunc != nil {
		return m.updateFunc(ctx, entity)
	}
	return nil
}
func (m *mockRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteFunc != nil {
		return m.deleteFunc(ctx, id)
	}
	return nil
}
func (m *mockRepo) UpdateLogo(ctx context.Context, id uuid.UUID, objectKey string) (*Entity, error) {
	if m.updateLogoFunc != nil {
		return m.updateLogoFunc(ctx, id, objectKey)
	}
	return &Entity{}, nil
}
func (m *mockRepo) ClearLogo(ctx context.Context, id uuid.UUID) error {
	if m.clearLogoFunc != nil {
		return m.clearLogoFunc(ctx, id)
	}
	return nil
}

type mockUserRepo struct {
	checkMembershipFunc      func(ctx context.Context, userID, entityID uuid.UUID) (bool, error)
	addUserToEntityFunc      func(ctx context.Context, userID, entityID uuid.UUID, role string) error
	removeUserFromEntityFunc func(ctx context.Context, userID, entityID uuid.UUID) error
	updateUserEntityRoleFunc func(ctx context.Context, userID, entityID uuid.UUID, role string) error
	getEntityMembersFunc     func(ctx context.Context, entityID uuid.UUID) ([]user.EntityMembership, error)
	getUserMembershipsFunc   func(ctx context.Context, userID uuid.UUID) ([]user.EntityMembership, error)
}

func (m *mockUserRepo) AddUserToEntity(ctx context.Context, userID, entityID uuid.UUID, role string) error {
	if m.addUserToEntityFunc != nil {
		return m.addUserToEntityFunc(ctx, userID, entityID, role)
	}
	return nil
}
func (m *mockUserRepo) RemoveUserFromEntity(ctx context.Context, userID, entityID uuid.UUID) error {
	if m.removeUserFromEntityFunc != nil {
		return m.removeUserFromEntityFunc(ctx, userID, entityID)
	}
	return nil
}
func (m *mockUserRepo) UpdateUserEntityRole(ctx context.Context, userID, entityID uuid.UUID, role string) error {
	if m.updateUserEntityRoleFunc != nil {
		return m.updateUserEntityRoleFunc(ctx, userID, entityID, role)
	}
	return nil
}
func (m *mockUserRepo) GetEntityMembers(ctx context.Context, entityID uuid.UUID) ([]user.EntityMembership, error) {
	if m.getEntityMembersFunc != nil {
		return m.getEntityMembersFunc(ctx, entityID)
	}
	return nil, nil
}
func (m *mockUserRepo) GetUserEntityMemberships(ctx context.Context, userID uuid.UUID) ([]user.EntityMembership, error) {
	if m.getUserMembershipsFunc != nil {
		return m.getUserMembershipsFunc(ctx, userID)
	}
	return nil, nil
}
func (m *mockUserRepo) CheckUserEntityMembership(ctx context.Context, userID, entityID uuid.UUID) (bool, error) {
	if m.checkMembershipFunc != nil {
		return m.checkMembershipFunc(ctx, userID, entityID)
	}
	return false, nil
}

type mockKratosUserService struct{}

func (m *mockKratosUserService) CreateUser(ctx context.Context, params kratos.CreateUserParams) (*kratos.UserIdentity, error) {
	return &kratos.UserIdentity{ID: uuid.New().String()}, nil
}

type mockUserService struct{}

func (m *mockUserService) CreateOrGetUser(ctx context.Context, kratosID string) (*user.User, error) {
	id, _ := uuid.Parse(kratosID)
	return &user.User{ID: id}, nil
}

type mockUserInvitationService struct {
	createEntityMemberFunc func(ctx context.Context, params user_invitation.CreateEntityMemberInvitationParams) (*user_invitation.UserInvitation, error)
}

func (m *mockUserInvitationService) CreateEntityMemberInvitation(ctx context.Context, params user_invitation.CreateEntityMemberInvitationParams) (*user_invitation.UserInvitation, error) {
	if m.createEntityMemberFunc != nil {
		return m.createEntityMemberFunc(ctx, params)
	}
	return &user_invitation.UserInvitation{}, nil
}

type mockStorage struct {
	generateURLFunc  func(ctx context.Context, entityID, fileID uuid.UUID, bucket, fileType, fileExtension string) (string, string, error)
	deleteObjectFunc func(ctx context.Context, bucket, objectKey string) error
}

func (m *mockStorage) GeneratePresignedUploadURL(ctx context.Context, entityID, fileID uuid.UUID, bucket, fileType, fileExtension string) (string, string, error) {
	if m.generateURLFunc != nil {
		return m.generateURLFunc(ctx, entityID, fileID, bucket, fileType, fileExtension)
	}
	return "obj-key", "https://upload.url", nil
}
func (m *mockStorage) DeleteObject(ctx context.Context, bucket, objectKey string) error {
	if m.deleteObjectFunc != nil {
		return m.deleteObjectFunc(ctx, bucket, objectKey)
	}
	return nil
}

// --- Helpers ---

func ptr[T any](v T) *T { return &v }

func newService(repo *mockRepo, userRepo *mockUserRepo, storage *mockStorage, invSvc *mockUserInvitationService) *Service {
	if repo == nil {
		repo = &mockRepo{}
	}
	if userRepo == nil {
		userRepo = &mockUserRepo{}
	}
	if storage == nil {
		storage = &mockStorage{}
	}
	if invSvc == nil {
		invSvc = &mockUserInvitationService{}
	}
	return New(repo, userRepo, &mockKratosUserService{}, &mockUserService{}, nil, invSvc, storage)
}

// --- Tests ---

func TestService_UpdateCertification_CertifierCannotBeUpdated(t *testing.T) {
	entityID := uuid.New()
	certifierID := uuid.New()

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, id uuid.UUID) (*Entity, error) {
			if id == entityID {
				return &Entity{ID: entityID, Type: TypeCertifier}, nil
			}
			return &Entity{ID: certifierID, Type: TypeCertifier}, nil
		},
	}
	svc := newService(repo, nil, nil, nil)

	_, err := svc.UpdateCertification(context.Background(), entityID, certifierID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cannot update certification for certifier")
}

func TestService_UpdateCertification_NonCertifierCertifier(t *testing.T) {
	entityID := uuid.New()
	nonCertifierID := uuid.New()

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, id uuid.UUID) (*Entity, error) {
			if id == entityID {
				return &Entity{ID: entityID, Type: TypePartner}, nil
			}
			return &Entity{ID: nonCertifierID, Type: TypePartner}, nil
		},
	}
	svc := newService(repo, nil, nil, nil)

	_, err := svc.UpdateCertification(context.Background(), entityID, nonCertifierID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not a certifier")
}

func TestService_UpdateCertification_Success(t *testing.T) {
	entityID := uuid.New()
	certifierID := uuid.New()

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, id uuid.UUID) (*Entity, error) {
			if id == entityID {
				return &Entity{ID: entityID, Type: TypePartner}, nil
			}
			return &Entity{ID: certifierID, Type: TypeCertifier}, nil
		},
	}
	svc := newService(repo, nil, nil, nil)

	result, err := svc.UpdateCertification(context.Background(), entityID, certifierID)
	require.NoError(t, err)
	assert.Equal(t, &certifierID, result.CertifiedBy)
}

func TestService_AddMember_AlreadyMember(t *testing.T) {
	entityID := uuid.New()
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{ID: entityID}, nil
		},
	}
	userRepo := &mockUserRepo{
		checkMembershipFunc: func(_ context.Context, _, _ uuid.UUID) (bool, error) {
			return true, nil
		},
	}
	svc := newService(repo, userRepo, nil, nil)

	err := svc.AddMember(context.Background(), entityID, uuid.New(), "member")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "already member")
}

func TestService_AddMember_Success(t *testing.T) {
	entityID := uuid.New()
	userID := uuid.New()
	var addedRole string

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{ID: entityID}, nil
		},
	}
	userRepo := &mockUserRepo{
		addUserToEntityFunc: func(_ context.Context, _, _ uuid.UUID, role string) error {
			addedRole = role
			return nil
		},
	}
	svc := newService(repo, userRepo, nil, nil)

	err := svc.AddMember(context.Background(), entityID, userID, "admin")
	require.NoError(t, err)
	assert.Equal(t, "admin", addedRole)
}

func TestService_RemoveMember_NotMember(t *testing.T) {
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{}, nil
		},
	}
	userRepo := &mockUserRepo{
		checkMembershipFunc: func(_ context.Context, _, _ uuid.UUID) (bool, error) {
			return false, nil
		},
	}
	svc := newService(repo, userRepo, nil, nil)

	err := svc.RemoveMember(context.Background(), uuid.New(), uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not member")
}

func TestService_RemoveMember_Success(t *testing.T) {
	removeCalled := false
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{}, nil
		},
	}
	userRepo := &mockUserRepo{
		checkMembershipFunc: func(_ context.Context, _, _ uuid.UUID) (bool, error) {
			return true, nil
		},
		removeUserFromEntityFunc: func(_ context.Context, _, _ uuid.UUID) error {
			removeCalled = true
			return nil
		},
	}
	svc := newService(repo, userRepo, nil, nil)

	err := svc.RemoveMember(context.Background(), uuid.New(), uuid.New())
	require.NoError(t, err)
	assert.True(t, removeCalled)
}

func TestService_AddMemberWithInvite_NilService(t *testing.T) {
	svc := New(&mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{}, nil
		},
	}, &mockUserRepo{}, nil, nil, nil, nil, &mockStorage{})

	err := svc.AddMemberWithInvite(context.Background(), AddMemberWithInviteParams{
		EntityID: uuid.New(),
		Email:    "test@test.com",
		Role:     "member",
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not configured")
}

func TestService_AddMemberWithInvite_Success(t *testing.T) {
	entityID := uuid.New()
	var calledParams user_invitation.CreateEntityMemberInvitationParams

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{ID: entityID, Name: "Test Certifier"}, nil
		},
	}
	invSvc := &mockUserInvitationService{
		createEntityMemberFunc: func(_ context.Context, params user_invitation.CreateEntityMemberInvitationParams) (*user_invitation.UserInvitation, error) {
			calledParams = params
			return &user_invitation.UserInvitation{}, nil
		},
	}
	svc := newService(repo, nil, nil, invSvc)

	err := svc.AddMemberWithInvite(context.Background(), AddMemberWithInviteParams{
		EntityID: entityID,
		Email:    "member@test.com",
		Name:     ptr("New Member"),
		Role:     "member",
	})
	require.NoError(t, err)
	assert.Equal(t, "member@test.com", calledParams.Email)
	assert.Equal(t, "Test Certifier", calledParams.EntityName)
	assert.Equal(t, "member", calledParams.Role)
}

func TestService_GenerateLogoUploadURL_NewLogo(t *testing.T) {
	entityID := uuid.New()
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{ID: entityID, LogoObjectKey: nil}, nil
		},
	}
	storage := &mockStorage{}
	svc := newService(repo, nil, storage, nil)

	objectKey, uploadURL, err := svc.GenerateLogoUploadURL(context.Background(), entityID, ".png")
	require.NoError(t, err)
	assert.Equal(t, "obj-key", objectKey)
	assert.Equal(t, "https://upload.url", uploadURL)
}

func TestService_GenerateLogoUploadURL_ReplacesOldLogo(t *testing.T) {
	entityID := uuid.New()
	deleteCalled := false

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{ID: entityID, LogoObjectKey: ptr("old-key")}, nil
		},
	}
	storage := &mockStorage{
		deleteObjectFunc: func(_ context.Context, _, _ string) error {
			deleteCalled = true
			return nil
		},
	}
	svc := newService(repo, nil, storage, nil)

	_, _, err := svc.GenerateLogoUploadURL(context.Background(), entityID, ".jpg")
	require.NoError(t, err)
	assert.True(t, deleteCalled)
}

func TestService_GenerateLogoUploadURL_StorageError(t *testing.T) {
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{}, nil
		},
	}
	storage := &mockStorage{
		generateURLFunc: func(_ context.Context, _, _ uuid.UUID, _, _, _ string) (string, string, error) {
			return "", "", errors.New("s3 error")
		},
	}
	svc := newService(repo, nil, storage, nil)

	_, _, err := svc.GenerateLogoUploadURL(context.Background(), uuid.New(), ".png")
	assert.Error(t, err)
}

func TestService_Create_SetsFields(t *testing.T) {
	var created *Entity
	repo := &mockRepo{
		createFunc: func(_ context.Context, e *Entity) error {
			created = e
			return nil
		},
	}
	svc := newService(repo, nil, nil, nil)

	result, err := svc.Create(context.Background(), CreateEntityParams{
		Name:         "ACP Clássicos",
		Type:         TypeCertifier,
		ContactEmail: "info@acp.pt",
	})
	require.NoError(t, err)
	assert.Equal(t, "ACP Clássicos", result.Name)
	assert.Equal(t, TypeCertifier, result.Type)
	assert.NotEqual(t, uuid.Nil, created.ID)
}

func TestService_Update_PartialFields(t *testing.T) {
	entity := &Entity{ID: uuid.New(), Name: "Old Name", ContactEmail: "old@test.com"}

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			copy := *entity
			return &copy, nil
		},
	}
	svc := newService(repo, nil, nil, nil)

	result, err := svc.Update(context.Background(), entity.ID, UpdateEntityParams{
		Name: ptr("New Name"),
	})
	require.NoError(t, err)
	assert.Equal(t, "New Name", result.Name)
	assert.Equal(t, "old@test.com", result.ContactEmail) // unchanged
}

func TestService_Update_AllFields(t *testing.T) {
	entity := &Entity{ID: uuid.New(), Name: "Old", ContactEmail: "old@test.com"}

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			copy := *entity
			return &copy, nil
		},
	}
	svc := newService(repo, nil, nil, nil)

	result, err := svc.Update(context.Background(), entity.ID, UpdateEntityParams{
		Name:         ptr("New"),
		Description:  ptr("A description"),
		ContactEmail: ptr("new@test.com"),
		Website:      ptr("https://example.com"),
		Address:      &Address{City: "Lisbon", Country: "PT"},
	})
	require.NoError(t, err)
	assert.Equal(t, "New", result.Name)
	assert.Equal(t, ptr("A description"), result.Description)
	assert.Equal(t, "new@test.com", result.ContactEmail)
	assert.Equal(t, ptr("https://example.com"), result.Website)
	assert.Equal(t, "Lisbon", result.Address.City)
}

func TestService_Update_NotFound(t *testing.T) {
	svc := newService(nil, nil, nil, nil)
	_, err := svc.Update(context.Background(), uuid.New(), UpdateEntityParams{})
	assert.ErrorIs(t, err, ErrEntityNotFound)
}

func TestService_Update_RepoError(t *testing.T) {
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{ID: uuid.New()}, nil
		},
		updateFunc: func(_ context.Context, _ *Entity) error {
			return errors.New("db error")
		},
	}
	svc := newService(repo, nil, nil, nil)

	_, err := svc.Update(context.Background(), uuid.New(), UpdateEntityParams{Name: ptr("X")})
	assert.Error(t, err)
}

func TestService_Delete_Success(t *testing.T) {
	deleteCalled := false
	entityID := uuid.New()
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{ID: entityID}, nil
		},
		deleteFunc: func(_ context.Context, id uuid.UUID) error {
			deleteCalled = true
			assert.Equal(t, entityID, id)
			return nil
		},
	}
	svc := newService(repo, nil, nil, nil)

	err := svc.Delete(context.Background(), entityID)
	require.NoError(t, err)
	assert.True(t, deleteCalled)
}

func TestService_Delete_NotFound(t *testing.T) {
	svc := newService(nil, nil, nil, nil)
	err := svc.Delete(context.Background(), uuid.New())
	assert.ErrorIs(t, err, ErrEntityNotFound)
}

func TestService_DeleteLogo_WithLogo(t *testing.T) {
	deletedFromStorage := false
	clearCalled := false
	entityID := uuid.New()

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{ID: entityID, LogoObjectKey: ptr("logo-key")}, nil
		},
		clearLogoFunc: func(_ context.Context, _ uuid.UUID) error {
			clearCalled = true
			return nil
		},
	}
	storage := &mockStorage{
		deleteObjectFunc: func(_ context.Context, _, key string) error {
			assert.Equal(t, "logo-key", key)
			deletedFromStorage = true
			return nil
		},
	}
	svc := newService(repo, nil, storage, nil)

	err := svc.DeleteLogo(context.Background(), entityID)
	require.NoError(t, err)
	assert.True(t, deletedFromStorage)
	assert.True(t, clearCalled)
}

func TestService_DeleteLogo_WithoutLogo(t *testing.T) {
	clearCalled := false
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{ID: uuid.New(), LogoObjectKey: nil}, nil
		},
		clearLogoFunc: func(_ context.Context, _ uuid.UUID) error {
			clearCalled = true
			return nil
		},
	}
	svc := newService(repo, nil, nil, nil)

	err := svc.DeleteLogo(context.Background(), uuid.New())
	require.NoError(t, err)
	assert.True(t, clearCalled)
}

func TestService_DeleteLogo_NotFound(t *testing.T) {
	svc := newService(nil, nil, nil, nil)
	err := svc.DeleteLogo(context.Background(), uuid.New())
	assert.ErrorIs(t, err, ErrEntityNotFound)
}

func TestService_GetMembers(t *testing.T) {
	entityID := uuid.New()
	expected := []user.EntityMembership{{UserID: uuid.New(), EntityID: entityID, Role: "admin"}}

	userRepo := &mockUserRepo{
		getEntityMembersFunc: func(_ context.Context, _ uuid.UUID) ([]user.EntityMembership, error) {
			return expected, nil
		},
	}
	svc := newService(nil, userRepo, nil, nil)

	result, err := svc.GetMembers(context.Background(), entityID)
	require.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestService_GetUserMemberships(t *testing.T) {
	userID := uuid.New()
	expected := []user.EntityMembership{{UserID: userID, EntityID: uuid.New(), Role: "member"}}

	userRepo := &mockUserRepo{
		getUserMembershipsFunc: func(_ context.Context, _ uuid.UUID) ([]user.EntityMembership, error) {
			return expected, nil
		},
	}
	svc := newService(nil, userRepo, nil, nil)

	result, err := svc.GetUserMemberships(context.Background(), userID)
	require.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestService_UpdateMemberRole_Success(t *testing.T) {
	var updatedRole string
	entityID := uuid.New()
	userID := uuid.New()

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{ID: entityID}, nil
		},
	}
	userRepo := &mockUserRepo{
		checkMembershipFunc: func(_ context.Context, _, _ uuid.UUID) (bool, error) {
			return true, nil
		},
		updateUserEntityRoleFunc: func(_ context.Context, _, _ uuid.UUID, role string) error {
			updatedRole = role
			return nil
		},
	}
	svc := newService(repo, userRepo, nil, nil)

	err := svc.UpdateMemberRole(context.Background(), entityID, userID, "admin")
	require.NoError(t, err)
	assert.Equal(t, "admin", updatedRole)
}

func TestService_UpdateMemberRole_NotMember(t *testing.T) {
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{}, nil
		},
	}
	userRepo := &mockUserRepo{
		checkMembershipFunc: func(_ context.Context, _, _ uuid.UUID) (bool, error) {
			return false, nil
		},
	}
	svc := newService(repo, userRepo, nil, nil)

	err := svc.UpdateMemberRole(context.Background(), uuid.New(), uuid.New(), "admin")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not member")
}

func TestService_UpdateMemberRole_EntityNotFound(t *testing.T) {
	svc := newService(nil, nil, nil, nil)
	err := svc.UpdateMemberRole(context.Background(), uuid.New(), uuid.New(), "admin")
	assert.ErrorIs(t, err, ErrEntityNotFound)
}

func TestService_AddMember_EntityNotFound(t *testing.T) {
	svc := newService(nil, nil, nil, nil)
	err := svc.AddMember(context.Background(), uuid.New(), uuid.New(), "member")
	assert.ErrorIs(t, err, ErrEntityNotFound)
}

func TestService_AddMember_CheckError(t *testing.T) {
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{}, nil
		},
	}
	userRepo := &mockUserRepo{
		checkMembershipFunc: func(_ context.Context, _, _ uuid.UUID) (bool, error) {
			return false, errors.New("db error")
		},
	}
	svc := newService(repo, userRepo, nil, nil)

	err := svc.AddMember(context.Background(), uuid.New(), uuid.New(), "member")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "check membership")
}

func TestService_RemoveMember_EntityNotFound(t *testing.T) {
	svc := newService(nil, nil, nil, nil)
	err := svc.RemoveMember(context.Background(), uuid.New(), uuid.New())
	assert.ErrorIs(t, err, ErrEntityNotFound)
}

func TestService_UpdateCertification_EntityNotFound(t *testing.T) {
	svc := newService(nil, nil, nil, nil)
	_, err := svc.UpdateCertification(context.Background(), uuid.New(), uuid.New())
	assert.ErrorIs(t, err, ErrEntityNotFound)
}

func TestService_UpdateCertification_CertifierNotFound(t *testing.T) {
	entityID := uuid.New()
	certifierID := uuid.New()

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, id uuid.UUID) (*Entity, error) {
			if id == entityID {
				return &Entity{ID: entityID, Type: TypePartner}, nil
			}
			return nil, ErrEntityNotFound
		},
	}
	svc := newService(repo, nil, nil, nil)

	_, err := svc.UpdateCertification(context.Background(), entityID, certifierID)
	assert.ErrorIs(t, err, ErrEntityNotFound)
}

func TestService_UpdateCertification_UpdateError(t *testing.T) {
	entityID := uuid.New()
	certifierID := uuid.New()

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, id uuid.UUID) (*Entity, error) {
			if id == entityID {
				return &Entity{ID: entityID, Type: TypePartner}, nil
			}
			return &Entity{ID: certifierID, Type: TypeCertifier}, nil
		},
		updateFunc: func(_ context.Context, _ *Entity) error {
			return errors.New("db error")
		},
	}
	svc := newService(repo, nil, nil, nil)

	_, err := svc.UpdateCertification(context.Background(), entityID, certifierID)
	assert.Error(t, err)
}

func TestService_Create_RepoError(t *testing.T) {
	repo := &mockRepo{
		createFunc: func(_ context.Context, _ *Entity) error {
			return errors.New("db error")
		},
	}
	svc := newService(repo, nil, nil, nil)

	_, err := svc.Create(context.Background(), CreateEntityParams{Name: "X", ContactEmail: "x@x.com"})
	assert.Error(t, err)
}

func TestService_AddMemberWithInvite_EntityNotFound(t *testing.T) {
	svc := newService(nil, nil, nil, nil)
	err := svc.AddMemberWithInvite(context.Background(), AddMemberWithInviteParams{
		EntityID: uuid.New(),
		Email:    "test@test.com",
		Role:     "member",
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "get entity")
}

func TestService_GenerateLogoUploadURL_EntityNotFound(t *testing.T) {
	svc := newService(nil, nil, nil, nil)
	_, _, err := svc.GenerateLogoUploadURL(context.Background(), uuid.New(), ".png")
	assert.ErrorIs(t, err, ErrEntityNotFound)
}

func TestService_GenerateLogoUploadURL_UpdateLogoError(t *testing.T) {
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{}, nil
		},
		updateLogoFunc: func(_ context.Context, _ uuid.UUID, _ string) (*Entity, error) {
			return nil, errors.New("db error")
		},
	}
	svc := newService(repo, nil, nil, nil)

	_, _, err := svc.GenerateLogoUploadURL(context.Background(), uuid.New(), ".png")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "update entity logo")
}

// --- Hydra client tests (httptest mock) ---

func newTestHydraServer(t *testing.T, handler http.HandlerFunc) (*httptest.Server, *hydra.Client) {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	client := hydra.New(server.URL)
	return server, client
}

func TestService_CreateClientForEntity_InvalidScopes(t *testing.T) {
	svc := newService(nil, nil, nil, nil)
	// hydraClient is nil but we won't reach it due to scope validation
	_, err := svc.CreateClientForEntity(context.Background(), uuid.New(), CreateClientParams{
		Scopes: []string{"invalid:scope"},
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid scopes")
}

func TestService_CreateClientForEntity_EntityNotFound(t *testing.T) {
	svc := newService(nil, nil, nil, nil)
	_, err := svc.CreateClientForEntity(context.Background(), uuid.New(), CreateClientParams{
		Scopes: []string{auth.ScopeVehiclesRead},
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "entity not found")
}

func TestService_CreateClientForEntity_Success(t *testing.T) {
	entityID := uuid.New()
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Entity, error) {
			return &Entity{ID: entityID, Name: "Test Entity"}, nil
		},
	}

	_, hc := newTestHydraServer(t, func(w http.ResponseWriter, r *http.Request) {
		clientID := "generated-client-id"
		clientSecret := "generated-secret"
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"client_id":     clientID,
			"client_secret": clientSecret,
			"scope":         "vehicles:read",
			"metadata": map[string]interface{}{
				"entity_id":   entityID.String(),
				"entity_name": "Test Entity",
				"created_by":  uuid.New().String(),
				"description": "test client",
			},
		})
	})

	svc := New(repo, &mockUserRepo{}, nil, nil, hc, nil, &mockStorage{})

	result, err := svc.CreateClientForEntity(context.Background(), entityID, CreateClientParams{
		CreatedBy:   uuid.New(),
		Description: "test client",
		Scopes:      []string{auth.ScopeVehiclesRead},
	})
	require.NoError(t, err)
	assert.Equal(t, "generated-client-id", result.ClientID)
}

func TestService_DeleteClientForEntity_Success(t *testing.T) {
	entityID := uuid.New()

	_, hc := newTestHydraServer(t, func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"client_id": "client-123",
				"scope":     "",
				"metadata": map[string]interface{}{
					"entity_id": entityID.String(),
				},
			})
		case "DELETE":
			w.WriteHeader(http.StatusNoContent)
		}
	})

	svc := New(&mockRepo{}, &mockUserRepo{}, nil, nil, hc, nil, &mockStorage{})

	err := svc.DeleteClientForEntity(context.Background(), entityID, "client-123")
	require.NoError(t, err)
}

func TestService_DeleteClientForEntity_WrongEntity(t *testing.T) {
	otherEntityID := uuid.New()

	_, hc := newTestHydraServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"client_id": "client-123",
			"scope":     "",
			"metadata": map[string]interface{}{
				"entity_id": otherEntityID.String(),
			},
		})
	})

	svc := New(&mockRepo{}, &mockUserRepo{}, nil, nil, hc, nil, &mockStorage{})

	err := svc.DeleteClientForEntity(context.Background(), uuid.New(), "client-123")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "does not belong")
}

func TestService_GetClientForEntity_Success(t *testing.T) {
	entityID := uuid.New()

	_, hc := newTestHydraServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"client_id": "client-123",
			"scope":     "vehicles:read",
			"metadata": map[string]interface{}{
				"entity_id":   entityID.String(),
				"entity_name": "Test",
			},
		})
	})

	svc := New(&mockRepo{}, &mockUserRepo{}, nil, nil, hc, nil, &mockStorage{})

	result, err := svc.GetClientForEntity(context.Background(), entityID, "client-123")
	require.NoError(t, err)
	assert.Equal(t, "client-123", result.ClientID)
	assert.Equal(t, entityID, result.EntityID)
}

func TestService_GetClientForEntity_WrongEntity(t *testing.T) {
	_, hc := newTestHydraServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"client_id": "client-123",
			"scope":     "",
			"metadata":  map[string]interface{}{"entity_id": uuid.New().String()},
		})
	})

	svc := New(&mockRepo{}, &mockUserRepo{}, nil, nil, hc, nil, &mockStorage{})

	_, err := svc.GetClientForEntity(context.Background(), uuid.New(), "client-123")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "does not belong")
}

func TestService_ListClientsForEntity(t *testing.T) {
	entityID := uuid.New()

	_, hc := newTestHydraServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]map[string]interface{}{
			{"client_id": "c1", "scope": "", "metadata": map[string]interface{}{"entity_id": entityID.String()}},
			{"client_id": "c2", "scope": "", "metadata": map[string]interface{}{"entity_id": uuid.New().String()}},
		})
	})

	svc := New(&mockRepo{}, &mockUserRepo{}, nil, nil, hc, nil, &mockStorage{})

	result, err := svc.ListClientsForEntity(context.Background(), entityID)
	require.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "c1", result[0].ClientID)
}
