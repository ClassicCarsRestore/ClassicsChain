package auth

import (
	"context"
	"fmt"

	"github.com/casbin/casbin/v2"
	"github.com/google/uuid"
)

// Authorizer handles authorization checks using Casbin
type Authorizer struct {
	enforcer    *casbin.Enforcer
	userService UserService
}

// NewAuthorizer creates a new authorizer with the given Casbin enforcer
func NewAuthorizer(enforcer *casbin.Enforcer, userService UserService) *Authorizer {
	return &Authorizer{
		enforcer:    enforcer,
		userService: userService,
	}
}

// Authorize checks if the user has permission to perform an action on a resource
func (a *Authorizer) Authorize(ctx context.Context, resource, action string) error {
	role, _ := ctx.Value(RoleKey).(string)
	if role == "" {
		role = RoleUser
	}

	allowed, err := a.enforcer.Enforce(role, resource, action)
	if err != nil {
		return fmt.Errorf("authorization error: %w", err)
	}

	if !allowed {
		return fmt.Errorf("forbidden: insufficient permissions")
	}

	return nil
}

// AuthorizeOwnership checks if the user has permission and owns the resource
func (a *Authorizer) AuthorizeOwnership(ctx context.Context, resource, action string, ownerID uuid.UUID) error {
	if IsAdmin(ctx) {
		return nil
	}

	if err := a.Authorize(ctx, resource, action); err != nil {
		return err
	}

	userID, ok := GetIdentityID(ctx)
	if !ok {
		return fmt.Errorf("forbidden: no user identity found")
	}

	if userID != ownerID {
		return fmt.Errorf("forbidden: can only %s own %s", action, resource)
	}

	return nil
}

// IsAdmin checks if the current user has admin role
func IsAdmin(ctx context.Context) bool {
	role, _ := ctx.Value(RoleKey).(string)
	return role == RoleAdmin
}

func IsUser(ctx context.Context) bool {
	role, _ := ctx.Value(RoleKey).(string)
	return role == RoleUser
}

// AuthorizeEntityMembership checks if the user is a member of an entity with a specific role
func (a *Authorizer) AuthorizeEntityMembership(ctx context.Context, entityID uuid.UUID, requiredRole string) error {
	userID, ok := GetIdentityID(ctx)
	if !ok {
		return fmt.Errorf("forbidden: no user identity found")
	}

	if IsAdmin(ctx) {
		return nil
	}

	role, err := a.userService.GetUserEntityRole(ctx, userID, entityID)
	if err != nil {
		return fmt.Errorf("forbidden: not a member of this entity")
	}

	if requiredRole != "" && role != requiredRole {
		return fmt.Errorf("forbidden: entity %s role required", requiredRole)
	}

	return nil
}

// IsEntityAdmin checks if the user is an admin of a specific entity
func (a *Authorizer) IsEntityAdmin(ctx context.Context, entityID uuid.UUID) bool {
	return a.AuthorizeEntityMembership(ctx, entityID, "admin") == nil
}

// IsOAuth2Request checks if the current request is authenticated via OAuth2
func IsOAuth2Request(ctx context.Context) bool {
	source, _ := ctx.Value(AuthSourceKey).(string)
	return source == AuthSourceOAuth2
}
