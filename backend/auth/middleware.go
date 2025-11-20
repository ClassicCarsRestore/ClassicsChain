package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/s1moe2/classics-chain/pkg/hydra"
	"github.com/s1moe2/classics-chain/pkg/kratos"
	"github.com/s1moe2/classics-chain/user"
)

type contextKey string

const (
	// IdentityIDKey is the context key for the authenticated user's identity ID
	IdentityIDKey contextKey = "identity_id"
	// IdentityEmailKey is the context key for the authenticated user's email
	IdentityEmailKey contextKey = "identity_email"
	// SessionKey is the context key for the session
	SessionKey contextKey = "session"
	// RoleKey is the context key for the user's role (admin, entity_member, or user)
	RoleKey contextKey = "role"
	// AuthSourceKey is the context key for the authentication source (session or oauth2)
	AuthSourceKey contextKey = "auth_source"
	// OAuth2ClientIDKey is the context key for the OAuth2 client ID
	OAuth2ClientIDKey contextKey = "oauth2_client_id"
	// OAuth2ScopesKey is the context key for the OAuth2 scopes
	OAuth2ScopesKey contextKey = "oauth2_scopes"
	// OAuth2EntityIDKey is the context key for the OAuth2 client's entity ID
	OAuth2EntityIDKey contextKey = "oauth2_entity_id"

	RoleAdmin               string = "admin"
	RoleEntityMember        string = "entity_member"
	RoleUser                string = "user"
	KratosSessionCookieName string = "ory_kratos_session"
	AuthSourceSession       string = "session"
	AuthSourceOAuth2        string = "oauth2"
)

// SessionValidator defines the interface for validating user sessions
type SessionValidator interface {
	ValidateSessionCookie(ctx context.Context, cookie string) (*kratos.Session, error)
}

// OAuth2Validator defines the interface for validating OAuth2 tokens
type OAuth2Validator interface {
	IntrospectToken(ctx context.Context, token string) (*hydra.OAuth2TokenIntrospection, error)
}

// UserService defines the interface for user operations
type UserService interface {
	GetByID(ctx context.Context, id uuid.UUID) (*user.User, error)
	GetUserEntityRole(ctx context.Context, userID, entityID uuid.UUID) (string, error)
	GetUserEntityMemberships(ctx context.Context, userID uuid.UUID) ([]user.EntityMembership, error)
}

// Middleware provides authentication middleware
type Middleware struct {
	validator       SessionValidator
	oauth2Validator OAuth2Validator
	userService     UserService
}

// NewMiddleware creates a new authentication middleware
func NewMiddleware(validator SessionValidator, userService UserService) *Middleware {
	return &Middleware{
		validator:   validator,
		userService: userService,
	}
}

// NewMiddlewareWithOAuth2 creates a new authentication middleware with OAuth2 support
func NewMiddlewareWithOAuth2(validator SessionValidator, oauth2Validator OAuth2Validator, userService UserService) *Middleware {
	return &Middleware{
		validator:       validator,
		oauth2Validator: oauth2Validator,
		userService:     userService,
	}
}

func (m *Middleware) Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Try OAuth2 bearer token first
		if m.oauth2Validator != nil {
			if token := m.extractBearerToken(r); token != "" {
				if m.handleOAuth2Auth(w, r, next, token) {
					return
				}
			}
		}

		// Fall back to session cookie
		cookie, err := r.Cookie(KratosSessionCookieName)
		if err != nil {
			http.Error(w, "Unauthorized: missing authentication", http.StatusUnauthorized)
			return
		}

		session, err := m.validator.ValidateSessionCookie(r.Context(), cookie.String())
		if err == nil && session.Active {
			identityID, err := uuid.Parse(session.IdentityID)
			if err != nil {
				http.Error(w, "Unauthorized: failed to parse identityID", http.StatusUnauthorized)
				return
			}

			// Determine user's role
			role := RoleUser
			if session.IsAdmin {
				role = RoleAdmin
			} else {
				// Check if user is a member of any entity
				memberships, err := m.userService.GetUserEntityMemberships(r.Context(), identityID)
				if err != nil {
					http.Error(w, "Unauthorized: failed to get user memberships", http.StatusUnauthorized)
					return
				}

				if len(memberships) > 0 {
					role = RoleEntityMember
				}
			}

			ctx := context.WithValue(r.Context(), IdentityIDKey, identityID)
			ctx = context.WithValue(ctx, IdentityEmailKey, session.Email)
			ctx = context.WithValue(ctx, SessionKey, session)
			ctx = context.WithValue(ctx, RoleKey, role)
			ctx = context.WithValue(ctx, AuthSourceKey, AuthSourceSession)
			r = r.WithContext(ctx)
		}

		next.ServeHTTP(w, r)
	})
}

func (m *Middleware) extractBearerToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}

	return parts[1]
}

func (m *Middleware) handleOAuth2Auth(w http.ResponseWriter, r *http.Request, next http.Handler, token string) bool {
	introspection, err := m.oauth2Validator.IntrospectToken(r.Context(), token)
	if err != nil || !introspection.Active {
		return false
	}

	ctx := r.Context()
	ctx = context.WithValue(ctx, AuthSourceKey, AuthSourceOAuth2)
	ctx = context.WithValue(ctx, OAuth2ClientIDKey, introspection.ClientID)
	ctx = context.WithValue(ctx, OAuth2ScopesKey, introspection.Scopes)
	ctx = context.WithValue(ctx, OAuth2EntityIDKey, introspection.EntityID)
	// Set role to entity_member for OAuth2 clients (they access entity-scoped resources)
	ctx = context.WithValue(ctx, RoleKey, RoleEntityMember)

	r = r.WithContext(ctx)
	next.ServeHTTP(w, r)
	return true
}

// GetIdentityID extracts the identity ID from the request context
func GetIdentityID(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(IdentityIDKey).(uuid.UUID)
	return id, ok
}

// GetIdentityEmail extracts the email from the request context
func GetIdentityEmail(ctx context.Context) (string, bool) {
	email, ok := ctx.Value(IdentityEmailKey).(string)
	return email, ok
}
