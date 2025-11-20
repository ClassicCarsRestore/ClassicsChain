package entity

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/s1moe2/classics-chain/auth"
	"github.com/s1moe2/classics-chain/pkg/hydra"
	"github.com/s1moe2/classics-chain/pkg/kratos"
	"github.com/s1moe2/classics-chain/user"
)

// Repository defines the data access interface for entities
type Repository interface {
	GetAll(ctx context.Context, limit, offset int, entityType *EntityType) ([]Entity, int, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Entity, error)
	Create(ctx context.Context, entity *Entity) error
	Update(ctx context.Context, entity *Entity) error
	Delete(ctx context.Context, id uuid.UUID) error
}

// UserRepository defines interface for user data access needed by entity service
type UserRepository interface {
	AddUserToEntity(ctx context.Context, userID, entityID uuid.UUID, role string) error
	RemoveUserFromEntity(ctx context.Context, userID, entityID uuid.UUID) error
	UpdateUserEntityRole(ctx context.Context, userID, entityID uuid.UUID, role string) error
	GetEntityMembers(ctx context.Context, entityID uuid.UUID) ([]user.EntityMembership, error)
	GetUserEntityMemberships(ctx context.Context, userID uuid.UUID) ([]user.EntityMembership, error)
	CheckUserEntityMembership(ctx context.Context, userID, entityID uuid.UUID) (bool, error)
}

// KratosUser represents a user created in Kratos
type KratosUser interface {
	GetID() string
	GetEmail() string
	GetName() *string
}

// KratosUserService defines interface for Kratos user operations
type KratosUserService interface {
	CreateUser(ctx context.Context, params kratos.CreateUserParams) (*kratos.UserIdentity, error)
	TriggerRecoveryForUser(ctx context.Context, email string) error
}

// UserService defines interface for user operations
type UserService interface {
	CreateOrGetUser(ctx context.Context, kratosID string) (*user.User, error)
}

// Service handles business logic for entity management
type Service struct {
	repo              Repository
	userRepo          UserRepository
	kratosUserService KratosUserService
	userService       UserService
	hydraClient       *hydra.Client
}

// New creates a new entity service with all dependencies
func New(repo Repository, userRepo UserRepository, kratosUserService KratosUserService, userService UserService, hydraClient *hydra.Client) *Service {
	return &Service{
		repo:              repo,
		userRepo:          userRepo,
		kratosUserService: kratosUserService,
		userService:       userService,
		hydraClient:       hydraClient,
	}
}

// GetAll retrieves paginated entities with optional type filter
func (s *Service) GetAll(ctx context.Context, limit, offset int, entityType *EntityType) ([]Entity, int, error) {
	return s.repo.GetAll(ctx, limit, offset, entityType)
}

// GetByID retrieves an entity by its ID
func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Entity, error) {
	return s.repo.GetByID(ctx, id)
}

// Create creates a new entity
func (s *Service) Create(ctx context.Context, params CreateEntityParams) (*Entity, error) {
	now := time.Now()
	entity := &Entity{
		ID:           uuid.New(),
		Name:         params.Name,
		Type:         params.Type,
		Description:  params.Description,
		ContactEmail: params.ContactEmail,
		Website:      params.Website,
		Address:      params.Address,
		CertifiedBy:  params.CertifiedBy,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.repo.Create(ctx, entity); err != nil {
		return nil, err
	}

	return entity, nil
}

// Update updates an existing entity
func (s *Service) Update(ctx context.Context, id uuid.UUID, params UpdateEntityParams) (*Entity, error) {
	entity, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if params.Name != nil {
		entity.Name = *params.Name
	}
	if params.Description != nil {
		entity.Description = params.Description
	}
	if params.ContactEmail != nil {
		entity.ContactEmail = *params.ContactEmail
	}
	if params.Website != nil {
		entity.Website = params.Website
	}
	if params.Address != nil {
		entity.Address = params.Address
	}
	entity.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, entity); err != nil {
		return nil, err
	}

	return entity, nil
}

// UpdateCertification updates which certifier vouched for an entity
// This is typically used when transferring responsibility or updating records
func (s *Service) UpdateCertification(ctx context.Context, entityID, certifierID uuid.UUID) (*Entity, error) {
	// Get the entity
	entity, err := s.repo.GetByID(ctx, entityID)
	if err != nil {
		return nil, err
	}

	// Partners can have their certification updated, but certifiers cannot
	if entity.Type == TypeCertifier {
		return nil, fmt.Errorf("cannot update certification for certifier entities")
	}

	// Get the certifier entity
	certifier, err := s.repo.GetByID(ctx, certifierID)
	if err != nil {
		return nil, err
	}

	// Verify it's actually a certifier type
	if certifier.Type != TypeCertifier {
		return nil, fmt.Errorf("entity is not a certifier")
	}

	// Update certification
	now := time.Now()
	entity.CertifiedBy = &certifierID
	entity.UpdatedAt = now

	if err := s.repo.Update(ctx, entity); err != nil {
		return nil, err
	}

	return entity, nil
}

// AddMember adds a user to an entity
func (s *Service) AddMember(ctx context.Context, entityID, userID uuid.UUID, role string) error {
	_, err := s.repo.GetByID(ctx, entityID)
	if err != nil {
		return err
	}

	exists, err := s.userRepo.CheckUserEntityMembership(ctx, userID, entityID)
	if err != nil {
		return fmt.Errorf("check membership: %w", err)
	}
	if exists {
		return fmt.Errorf("user already member of entity")
	}

	return s.userRepo.AddUserToEntity(ctx, userID, entityID, role)
}

// RemoveMember removes a user from an entity
func (s *Service) RemoveMember(ctx context.Context, entityID, userID uuid.UUID) error {
	_, err := s.repo.GetByID(ctx, entityID)
	if err != nil {
		return err
	}

	exists, err := s.userRepo.CheckUserEntityMembership(ctx, userID, entityID)
	if err != nil {
		return fmt.Errorf("check membership: %w", err)
	}
	if !exists {
		return fmt.Errorf("user not member of entity")
	}

	return s.userRepo.RemoveUserFromEntity(ctx, userID, entityID)
}

// GetMembers retrieves all members of an entity
func (s *Service) GetMembers(ctx context.Context, entityID uuid.UUID) ([]user.EntityMembership, error) {
	return s.userRepo.GetEntityMembers(ctx, entityID)
}

// GetUserMemberships retrieves all entities a user belongs to
func (s *Service) GetUserMemberships(ctx context.Context, userID uuid.UUID) ([]user.EntityMembership, error) {
	return s.userRepo.GetUserEntityMemberships(ctx, userID)
}

// UpdateMemberRole updates a user's role within an entity
func (s *Service) UpdateMemberRole(ctx context.Context, entityID, userID uuid.UUID, role string) error {
	_, err := s.repo.GetByID(ctx, entityID)
	if err != nil {
		return err
	}

	exists, err := s.userRepo.CheckUserEntityMembership(ctx, userID, entityID)
	if err != nil {
		return fmt.Errorf("check membership: %w", err)
	}
	if !exists {
		return fmt.Errorf("user not member of entity")
	}

	return s.userRepo.UpdateUserEntityRole(ctx, userID, entityID, role)
}

// AddMemberWithInviteParams contains parameters for adding a member with invitation
type AddMemberWithInviteParams struct {
	EntityID uuid.UUID
	Email    string
	Name     *string
	Role     string
}

// AddMemberResult contains the result of adding a member
type AddMemberResult struct {
	UserID uuid.UUID
	Email  string
	Name   *string
	Role   string
}

// AddMemberWithInvite orchestrates adding a new member to an entity with email invitation
// It handles: creating Kratos user, database user, entity membership, and recovery email
func (s *Service) AddMemberWithInvite(ctx context.Context, params AddMemberWithInviteParams) (*AddMemberResult, error) {
	kratosUser, err := s.kratosUserService.CreateUser(ctx, kratos.CreateUserParams{
		Email:   params.Email,
		Name:    params.Name,
		IsAdmin: false,
	})
	if err != nil {
		return nil, fmt.Errorf("create kratos user: %w", err)
	}

	dbUser, err := s.userService.CreateOrGetUser(ctx, kratosUser.GetID())
	if err != nil {
		return nil, fmt.Errorf("create database user: %w", err)
	}

	if err := s.userRepo.AddUserToEntity(ctx, dbUser.ID, params.EntityID, params.Role); err != nil {
		return nil, fmt.Errorf("add user to entity: %w", err)
	}

	if err := s.kratosUserService.TriggerRecoveryForUser(ctx, params.Email); err != nil {
		// Log error but don't fail - user can request recovery manually
		fmt.Printf("Failed to trigger recovery email for %s: %v\n", params.Email, err)
	}

	return &AddMemberResult{
		UserID: dbUser.ID,
		Email:  params.Email,
		Name:   params.Name,
		Role:   params.Role,
	}, nil
}

// CreateClientParams contains parameters for creating an OAuth2 client
type CreateClientParams struct {
	EntityID    uuid.UUID
	CreatedBy   uuid.UUID
	Description string
	Scopes      []string
}

// CreateClientForEntity creates a new OAuth2 client for an entity
func (s *Service) CreateClientForEntity(ctx context.Context, entityID uuid.UUID, params CreateClientParams) (*hydra.OAuth2Client, error) {
	if err := auth.ValidateScopes(params.Scopes); err != nil {
		return nil, fmt.Errorf("invalid scopes: %w", err)
	}

	entity, err := s.GetByID(ctx, entityID)
	if err != nil {
		return nil, fmt.Errorf("entity not found: %w", err)
	}

	hydraParams := hydra.CreateClientParams{
		EntityID:    entityID,
		EntityName:  entity.Name,
		CreatedBy:   params.CreatedBy,
		Description: params.Description,
		Scopes:      params.Scopes,
	}

	return s.hydraClient.CreateClientCredentialsClient(ctx, hydraParams)
}

// DeleteClientForEntity deletes an OAuth2 client for an entity
func (s *Service) DeleteClientForEntity(ctx context.Context, entityID uuid.UUID, clientID string) error {
	client, err := s.hydraClient.GetClient(ctx, clientID)
	if err != nil {
		return fmt.Errorf("client not found: %w", err)
	}

	if client.EntityID != entityID {
		return fmt.Errorf("client does not belong to this entity")
	}

	return s.hydraClient.DeleteClient(ctx, clientID)
}

// ListClientsForEntity lists OAuth2 clients for a specific entity
func (s *Service) ListClientsForEntity(ctx context.Context, entityID uuid.UUID) ([]hydra.OAuth2Client, error) {
	return s.hydraClient.ListClientsByEntity(ctx, entityID)
}

// GetClientForEntity retrieves a single OAuth2 client for an entity
func (s *Service) GetClientForEntity(ctx context.Context, entityID uuid.UUID, clientID string) (*hydra.OAuth2Client, error) {
	client, err := s.hydraClient.GetClient(ctx, clientID)
	if err != nil {
		return nil, fmt.Errorf("client not found: %w", err)
	}

	if client.EntityID != entityID {
		return nil, fmt.Errorf("client does not belong to this entity")
	}

	return client, nil
}
