package user

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/s1moe2/classics-chain/pkg/kratos"
	"github.com/s1moe2/classics-chain/user_invitation"
)

// Repository defines the data access interface for users
type Repository interface {
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	Create(ctx context.Context, user *User) error
	GetUserEntityMemberships(ctx context.Context, userID uuid.UUID) ([]EntityMembership, error)
	AddUserToEntity(ctx context.Context, userID, entityID uuid.UUID, role string) error
	GetUserEntityRole(ctx context.Context, userID, entityID uuid.UUID) (string, error)
}

// KratosClient defines the interface for Kratos operations
type KratosClient interface {
	ListAdminUsers(ctx context.Context) ([]kratos.UserIdentity, error)
	GetUser(ctx context.Context, userID string) (*kratos.UserIdentity, error)
	CreateUser(ctx context.Context, params kratos.CreateUserParams) (*kratos.UserIdentity, error)
	UpdateUser(ctx context.Context, userID string, params kratos.UpdateUserParams) (*kratos.UserIdentity, error)
}

// InvitationService defines the interface for invitation operations
type InvitationService interface {
	GetPendingInvitationsForEmail(ctx context.Context, email string) ([]interface{}, error)
}

// VehicleService defines the interface for vehicle operations
type VehicleService interface {
	GetByID(ctx context.Context, id uuid.UUID) (interface{}, error)
}

// UserInvitationService defines the interface for user invitation operations
type UserInvitationService interface {
	CreateAdminInvitation(ctx context.Context, params user_invitation.CreateAdminInvitationParams) (*user_invitation.UserInvitation, error)
}

// Service handles business logic for user management
type Service struct {
	repo                  Repository
	kratos                KratosClient
	invitationService     InvitationService
	vehicleService        VehicleService
	userInvitationService UserInvitationService
}

// NewService creates a new user service
func NewService(repo Repository) *Service {
	return &Service{
		repo: repo,
	}
}

// NewServiceWithKratos creates a new user service with Kratos integration
func NewServiceWithKratos(repo Repository, kratos KratosClient) *Service {
	return &Service{
		repo:   repo,
		kratos: kratos,
	}
}

// NewServiceWithDependencies creates a new user service with all dependencies
func NewServiceWithDependencies(repo Repository, kratos KratosClient, invitationService InvitationService, vehicleService VehicleService, userInvitationService UserInvitationService) *Service {
	return &Service{
		repo:                  repo,
		kratos:                kratos,
		invitationService:     invitationService,
		vehicleService:        vehicleService,
		userInvitationService: userInvitationService,
	}
}

// SetUserInvitationService sets the user invitation service dependency
func (s *Service) SetUserInvitationService(userInvitationService UserInvitationService) {
	s.userInvitationService = userInvitationService
}

// GetByID retrieves a user by ID
func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	return s.repo.GetByID(ctx, id)
}

// GetUserEntityMemberships retrieves all entities a user belongs to
func (s *Service) GetUserEntityMemberships(ctx context.Context, userID uuid.UUID) ([]EntityMembership, error) {
	return s.repo.GetUserEntityMemberships(ctx, userID)
}

// GetUserEntityRole gets a user's role within an entity
func (s *Service) GetUserEntityRole(ctx context.Context, userID, entityID uuid.UUID) (string, error) {
	return s.repo.GetUserEntityRole(ctx, userID, entityID)
}

// CreateAdmin creates a new admin user
func (s *Service) CreateAdmin(ctx context.Context, identityID string) (*User, error) {
	userID, err := uuid.Parse(identityID)
	if err != nil {
		return nil, fmt.Errorf("parse identity ID: %w", err)
	}

	// Check if user already exists
	_, err = s.repo.GetByID(ctx, userID)
	if err != nil && !errors.Is(err, ErrUserNotFound) {
		return nil, fmt.Errorf("check user existence: %w", err)
	}

	if err == nil {
		return nil, ErrUserAlreadyExists
	}

	// Create new admin user
	newUser := &User{
		ID:      userID,
		IsAdmin: true,
	}

	if err := s.repo.Create(ctx, newUser); err != nil {
		return nil, fmt.Errorf("create admin user: %w", err)
	}

	return newUser, nil
}

// CreateOrGetUser creates a new regular user or returns existing user
// This is used when inviting users to entities - if they already exist, just return them
func (s *Service) CreateOrGetUser(ctx context.Context, identityID string) (*User, error) {
	userID, err := uuid.Parse(identityID)
	if err != nil {
		return nil, fmt.Errorf("parse identity ID: %w", err)
	}

	// Check if user already exists
	existingUser, err := s.repo.GetByID(ctx, userID)
	if err != nil && !errors.Is(err, ErrUserNotFound) {
		return nil, fmt.Errorf("check user existence: %w", err)
	}

	if err == nil {
		// User already exists, return it
		return existingUser, nil
	}

	// Create new regular user (not admin)
	newUser := &User{
		ID:      userID,
		IsAdmin: false,
	}

	if err := s.repo.Create(ctx, newUser); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	return newUser, nil
}

// ListAdminUsers lists all admin users with their Kratos traits (email, name)
// Pagination is applied in-memory after filtering for admin users
func (s *Service) ListAdminUsers(ctx context.Context, limit, offset int) ([]AdminUserWithTraits, int, error) {
	if s.kratos == nil {
		return nil, 0, fmt.Errorf("kratos client not configured")
	}

	// List admin users from Kratos
	adminIdentities, err := s.kratos.ListAdminUsers(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("list admin users: %w", err)
	}

	// Convert to AdminUserWithTraits
	allAdminUsers := make([]AdminUserWithTraits, 0, len(adminIdentities))
	for _, identity := range adminIdentities {
		identityID, err := uuid.Parse(identity.ID)
		if err != nil {
			continue
		}

		adminUser := AdminUserWithTraits{
			ID:    identityID,
			Email: identity.Email,
			Name:  identity.Name,
		}

		allAdminUsers = append(allAdminUsers, adminUser)
	}

	// Apply pagination to results
	total := len(allAdminUsers)
	start := offset
	end := offset + limit

	// Handle boundary conditions
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}
	if start < 0 {
		start = 0
	}

	adminUsers := allAdminUsers[start:end]

	return adminUsers, total, nil
}

// CreateAdminInvitation creates an invitation for a new admin user
func (s *Service) CreateAdminInvitation(ctx context.Context, email string, name *string) error {
	if s.userInvitationService == nil {
		return fmt.Errorf("user invitation service not configured")
	}

	params := user_invitation.CreateAdminInvitationParams{
		Email: email,
		Name:  name,
	}

	_, err := s.userInvitationService.CreateAdminInvitation(ctx, params)
	if err != nil {
		return fmt.Errorf("create admin invitation: %w", err)
	}

	return nil
}

// GetAdminUserWithTraits retrieves an admin user with data from both database and Kratos
func (s *Service) GetAdminUserWithTraits(ctx context.Context, userID uuid.UUID) (*AdminUserWithTraits, error) {
	if s.kratos == nil {
		return nil, fmt.Errorf("kratos client not configured")
	}

	dbUser, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user from database: %w", err)
	}

	if dbUser == nil {
		return nil, ErrUserNotFound
	}

	if !dbUser.IsAdmin {
		return nil, ErrUserNotAdmin
	}

	user, err := s.kratos.GetUser(ctx, userID.String())
	if err != nil {
		return nil, fmt.Errorf("get user from kratos: %w", err)
	}

	result := &AdminUserWithTraits{
		ID:    dbUser.ID,
		Email: user.Email,
		Name:  user.Name,
	}

	return result, nil
}

// RemoveAdminPrivileges removes admin role from a user by updating Kratos metadata
func (s *Service) RemoveAdminPrivileges(ctx context.Context, userID uuid.UUID) error {
	if s.kratos == nil {
		return fmt.Errorf("kratos client not configured")
	}

	user, err := s.kratos.GetUser(ctx, userID.String())
	if err != nil {
		return fmt.Errorf("get user from kratos: %w", err)
	}

	if !user.IsAdmin {
		return ErrUserNotAdmin
	}

	// Update to remove admin flag
	isAdmin := false
	_, err = s.kratos.UpdateUser(ctx, userID.String(), kratos.UpdateUserParams{
		IsAdmin: &isAdmin,
	})
	if err != nil {
		return fmt.Errorf("update user in kratos: %w", err)
	}

	return nil
}

// UserProfileResult contains the complete user profile with memberships and invitations
type UserProfileResult struct {
	UserID                    uuid.UUID
	EntityMemberships         []EntityMembership
	PendingInvitationVehicles []interface{} // Vehicle details for pending invitations
}

// GetUserProfile retrieves the complete user profile including entity memberships and pending invitations
func (s *Service) GetUserProfile(ctx context.Context, userID uuid.UUID, email string) (*UserProfileResult, error) {
	result := &UserProfileResult{
		UserID:                    userID,
		EntityMemberships:         []EntityMembership{},
		PendingInvitationVehicles: []interface{}{},
	}

	// Get entity memberships
	memberships, err := s.repo.GetUserEntityMemberships(ctx, userID)
	if err == nil {
		result.EntityMemberships = memberships
	}

	// Get pending invitations if services are available
	if s.invitationService != nil && s.vehicleService != nil && email != "" {
		pendingInvitations, err := s.invitationService.GetPendingInvitationsForEmail(ctx, email)
		if err == nil && len(pendingInvitations) > 0 {
			// Build unique vehicles list (deduplication)
			vehiclesMap := make(map[uuid.UUID]interface{})

			for _, inv := range pendingInvitations {
				// Convert invitation to map to extract vehicle ID
				invMap, ok := inv.(map[string]interface{})
				if !ok {
					continue
				}

				vehicleIDRaw, ok := invMap["vehicle_id"]
				if !ok {
					continue
				}

				var vehicleID uuid.UUID
				switch v := vehicleIDRaw.(type) {
				case uuid.UUID:
					vehicleID = v
				case string:
					var err error
					vehicleID, err = uuid.Parse(v)
					if err != nil {
						continue
					}
				default:
					continue
				}

				// Skip if already processed
				if _, exists := vehiclesMap[vehicleID]; exists {
					continue
				}

				// Get vehicle details
				vehicle, err := s.vehicleService.GetByID(ctx, vehicleID)
				if err != nil {
					continue
				}

				vehiclesMap[vehicleID] = vehicle
			}

			// Convert map to slice
			for _, vehicle := range vehiclesMap {
				result.PendingInvitationVehicles = append(result.PendingInvitationVehicles, vehicle)
			}
		}
	}

	return result, nil
}
