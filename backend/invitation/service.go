package invitation

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Repository defines the data access interface for invitations
type Repository interface {
	CreateInvitation(ctx context.Context, params CreateInvitationParams) (*Invitation, error)
	GetPendingInvitationsByEmail(ctx context.Context, email string) ([]Invitation, error)
	GetInvitationsByEmailAndVehicle(ctx context.Context, email string, vehicleIDs []uuid.UUID) ([]Invitation, error)
	GetInvitationByToken(ctx context.Context, token string) (*Invitation, error)
	ClaimInvitation(ctx context.Context, invitationID uuid.UUID) (*Invitation, error)
	ClaimInvitationsByEmail(ctx context.Context, email string) error
	DeleteInvitation(ctx context.Context, id uuid.UUID) error
	GetInvitationByID(ctx context.Context, id uuid.UUID) (*Invitation, error)
	GetAllPendingInvitations(ctx context.Context) ([]Invitation, error)
}

// VehicleService handles vehicle operations
type VehicleService interface {
	AssignOwnership(ctx context.Context, vehicleID uuid.UUID, ownerID uuid.UUID) error
}

// Service handles business logic for invitation management
type Service struct {
	repo     Repository
	vehicles VehicleService
	mailer   Mailer
}

// NewService creates a new invitation service
func NewService(repo Repository, vehicles VehicleService, mailer Mailer) *Service {
	return &Service{
		repo:     repo,
		vehicles: vehicles,
		mailer:   mailer,
	}
}

// generateInvitationToken generates a secure random token
func generateInvitationToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// CreateInvitation creates a new invitation for a vehicle and email
func (s *Service) CreateInvitation(ctx context.Context, vehicleID uuid.UUID, email string) error {
	token, err := generateInvitationToken()
	if err != nil {
		return fmt.Errorf("generate token: %w", err)
	}

	params := CreateInvitationParams{
		VehicleID:      vehicleID,
		Email:          email,
		Token:          token,
		TokenExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 days expiry
	}

	_, err = s.repo.CreateInvitation(ctx, params)
	return err
}

// GetPendingInvitationsForEmail retrieves all pending invitations for an email
func (s *Service) GetPendingInvitationsForEmail(ctx context.Context, email string) ([]Invitation, error) {
	return s.repo.GetPendingInvitationsByEmail(ctx, email)
}

// SendInvitationBatch creates invitation tokens and sends invitation emails for multiple vehicles
func (s *Service) SendInvitationBatch(ctx context.Context, email string, vehicleIDs []uuid.UUID, vehicleData []map[string]interface{}) error {
	// Generate a single shared token for all vehicles for this email
	token, err := generateInvitationToken()
	if err != nil {
		return fmt.Errorf("generate token: %w", err)
	}

	expiresAt := time.Now().Add(7 * 24 * time.Hour) // 7 days expiry

	// Create invitation records for each vehicle with the same token
	// This allows a single registration link to claim all invited vehicles
	for _, vehicleID := range vehicleIDs {
		params := CreateInvitationParams{
			VehicleID:      vehicleID,
			Email:          email,
			Token:          token,
			TokenExpiresAt: expiresAt,
		}
		_, err := s.repo.CreateInvitation(ctx, params)
		if err != nil {
			return fmt.Errorf("create invitation for vehicle %s: %w", vehicleID, err)
		}
	}

	// Convert vehicle data to VehicleInfo structs
	vehicles := make([]VehicleInfo, len(vehicleData))
	for i, v := range vehicleData {
		vehicles[i] = VehicleInfo{
			Make:         getStringFromMap(v, "make"),
			Model:        getStringFromMap(v, "model"),
			Year:         getIntFromMap(v, "year"),
			LicensePlate: getStringFromMap(v, "licensePlate"),
		}
	}

	// Send invitation email
	if err := s.mailer.SendOwnerInvitation(ctx, email, token, vehicles); err != nil {
		return fmt.Errorf("send invitation email: %w", err)
	}

	return nil
}

// getStringFromMap safely extracts a string value from a map
func getStringFromMap(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

// getIntFromMap safely extracts an int value from a map
func getIntFromMap(m map[string]interface{}, key string) int {
	if v, ok := m[key].(float64); ok {
		return int(v)
	}
	if v, ok := m[key].(int); ok {
		return v
	}
	return 0
}

// ClaimInvitations marks invitations as claimed and assigns vehicle ownership
func (s *Service) ClaimInvitations(ctx context.Context, email string, ownerID uuid.UUID) error {
	// Get all pending invitations for this email
	invitations, err := s.repo.GetPendingInvitationsByEmail(ctx, email)
	if err != nil {
		return fmt.Errorf("get pending invitations: %w", err)
	}

	// Assign ownership for each vehicle
	for _, inv := range invitations {
		if err := s.vehicles.AssignOwnership(ctx, inv.VehicleID, ownerID); err != nil {
			return fmt.Errorf("assign ownership for vehicle %s: %w", inv.VehicleID, err)
		}

		// Mark invitation as claimed
		if _, err := s.repo.ClaimInvitation(ctx, inv.ID); err != nil {
			return fmt.Errorf("claim invitation %s: %w", inv.ID, err)
		}
	}

	return nil
}

// GetPendingInvitations retrieves all pending invitations
func (s *Service) GetPendingInvitations(ctx context.Context) ([]Invitation, error) {
	return s.repo.GetAllPendingInvitations(ctx)
}

// ValidateInvitationToken validates a token and returns the invitation details
func (s *Service) ValidateInvitationToken(ctx context.Context, token string) (*Invitation, error) {
	// GetInvitationByToken already checks that token is valid and not expired
	return s.repo.GetInvitationByToken(ctx, token)
}

// GetInvitationsByToken retrieves all invitations (vehicles) for a given token
func (s *Service) GetInvitationsByToken(ctx context.Context, token string) ([]Invitation, string, error) {
	firstInv, err := s.repo.GetInvitationByToken(ctx, token)
	if err != nil {
		if errors.Is(err, ErrInvitationNotFound) {
			return nil, "", ErrInvitationNotFound
		}
		return nil, "", fmt.Errorf("failed to get invitation by token: %w", err)
	}

	invitations, err := s.repo.GetPendingInvitationsByEmail(ctx, firstInv.Email)
	if err != nil {
		return nil, "", fmt.Errorf("get invitations: %w", err)
	}

	return invitations, firstInv.Email, nil
}
