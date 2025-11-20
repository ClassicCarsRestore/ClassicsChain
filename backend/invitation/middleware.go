package invitation

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	kratos "github.com/ory/kratos-client-go"
)

// OnRegistrationComplete handles post-registration logic to claim invited vehicles
func (s *Service) OnRegistrationComplete(identityID uuid.UUID, identity *kratos.Identity) error {
	if identity == nil || identity.Traits == nil {
		return fmt.Errorf("invalid identity")
	}

	// Extract email from traits
	traitsMap, ok := identity.Traits.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid traits format")
	}

	email, ok := traitsMap["email"].(string)
	if !ok || email == "" {
		return fmt.Errorf("email not found in identity traits")
	}

	// Claim any pending invitations for this email
	ctx := context.Background()
	if err := s.ClaimInvitations(ctx, email, identityID); err != nil {
		return fmt.Errorf("claim invitations: %w", err)
	}

	return nil
}

// RegistrationCompleteMiddleware wraps an HTTP handler to invoke OnRegistrationComplete
// This should be called after successful Kratos registration/recovery flow completion
type RegistrationCompleteMiddleware struct {
	service *Service
}

// NewRegistrationCompleteMiddleware creates a new registration completion middleware
func NewRegistrationCompleteMiddleware(service *Service) *RegistrationCompleteMiddleware {
	return &RegistrationCompleteMiddleware{service: service}
}

// Wrap wraps the given HTTP handler to check and claim invitations after auth
func (m *RegistrationCompleteMiddleware) WrapHandler(identityID uuid.UUID, identity *kratos.Identity) error {
	return m.service.OnRegistrationComplete(identityID, identity)
}
