package auth

import (
	"context"
	"fmt"
)

const (
	// Vehicle scopes
	ScopeVehiclesRead  = "vehicles:read"
	ScopeVehiclesWrite = "vehicles:write"

	// Certification scopes
	ScopeCertificationsRead  = "certifications:read"
	ScopeCertificationsWrite = "certifications:write"

	// Event scopes
	ScopeEventsRead  = "events:read"
	ScopeEventsWrite = "events:write"
)

// AllScopes contains all available scopes
var AllScopes = []string{
	ScopeVehiclesRead,
	ScopeVehiclesWrite,
	ScopeCertificationsRead,
	ScopeCertificationsWrite,
	ScopeEventsRead,
	ScopeEventsWrite,
}

// ValidateScopes checks if all requested scopes are valid
func ValidateScopes(scopes []string) error {
	validScopesMap := make(map[string]bool)
	for _, scope := range AllScopes {
		validScopesMap[scope] = true
	}

	for _, scope := range scopes {
		if !validScopesMap[scope] {
			return fmt.Errorf("invalid scope: %s", scope)
		}
	}

	return nil
}

// HasScope checks if a context has a specific scope (for OAuth2 requests)
func HasScope(ctx context.Context, requiredScope string) bool {
	scopes, ok := GetScopesFromContext(ctx)
	if !ok {
		return false
	}

	for _, scope := range scopes {
		if scope == requiredScope {
			return true
		}
	}

	return false
}

// GetScopesFromContext extracts OAuth2 scopes from context, if available
func GetScopesFromContext(ctx context.Context) ([]string, bool) {
	scopes, ok := ctx.Value(OAuth2ScopesKey).([]string)
	return scopes, ok
}
