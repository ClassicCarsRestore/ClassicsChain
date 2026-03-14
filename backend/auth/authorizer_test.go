package auth

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ClassicCarsRestore/ClassicsChain/pkg/hydra"
	"github.com/ClassicCarsRestore/ClassicsChain/pkg/kratos"
	"github.com/ClassicCarsRestore/ClassicsChain/user"
	"github.com/casbin/casbin/v2"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// --- Mocks ---

type mockUserService struct {
	getUserEntityRoleFunc        func(ctx context.Context, userID, entityID uuid.UUID) (string, error)
	getUserEntityMembershipsFunc func(ctx context.Context, userID uuid.UUID) ([]user.EntityMembership, error)
}

func (m *mockUserService) GetUserEntityRole(ctx context.Context, userID, entityID uuid.UUID) (string, error) {
	if m.getUserEntityRoleFunc != nil {
		return m.getUserEntityRoleFunc(ctx, userID, entityID)
	}
	return "", nil
}
func (m *mockUserService) GetUserEntityMemberships(ctx context.Context, userID uuid.UUID) ([]user.EntityMembership, error) {
	if m.getUserEntityMembershipsFunc != nil {
		return m.getUserEntityMembershipsFunc(ctx, userID)
	}
	return nil, nil
}

// --- Helpers ---

func newTestEnforcer(t *testing.T) *casbin.Enforcer {
	t.Helper()
	e, err := casbin.NewEnforcer("../casbin_model.conf", "../casbin_policy.csv")
	require.NoError(t, err)
	return e
}

func ctxWithRole(role string) context.Context {
	return context.WithValue(context.Background(), RoleKey, role)
}

func ctxWithIdentity(userID uuid.UUID, role string) context.Context {
	ctx := context.WithValue(context.Background(), IdentityIDKey, userID)
	ctx = context.WithValue(ctx, RoleKey, role)
	return ctx
}

// --- Tests ---

func TestAuthorizer_Authorize_AdminAllowed(t *testing.T) {
	enforcer := newTestEnforcer(t)
	auth := NewAuthorizer(enforcer, &mockUserService{})

	ctx := ctxWithRole(RoleAdmin)
	err := auth.Authorize(ctx, "vehicles", "create")
	assert.NoError(t, err)
}

func TestAuthorizer_Authorize_UserAllowed(t *testing.T) {
	enforcer := newTestEnforcer(t)
	auth := NewAuthorizer(enforcer, &mockUserService{})

	ctx := ctxWithRole(RoleUser)
	err := auth.Authorize(ctx, "vehicles", "read")
	assert.NoError(t, err)
}

func TestAuthorizer_Authorize_UserDenied(t *testing.T) {
	enforcer := newTestEnforcer(t)
	auth := NewAuthorizer(enforcer, &mockUserService{})

	ctx := ctxWithRole(RoleUser)
	err := auth.Authorize(ctx, "vehicles", "transfer")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "forbidden")
}

func TestAuthorizer_Authorize_DefaultsToUser(t *testing.T) {
	enforcer := newTestEnforcer(t)
	auth := NewAuthorizer(enforcer, &mockUserService{})

	err := auth.Authorize(context.Background(), "vehicles", "read")
	assert.NoError(t, err)
}

func TestAuthorizer_AuthorizeOwnership_AdminBypass(t *testing.T) {
	enforcer := newTestEnforcer(t)
	auth := NewAuthorizer(enforcer, &mockUserService{})

	ctx := ctxWithRole(RoleAdmin)
	randomOwner := uuid.New()
	err := auth.AuthorizeOwnership(ctx, "vehicles", "read", randomOwner)
	assert.NoError(t, err)
}

func TestAuthorizer_AuthorizeOwnership_OwnerMatch(t *testing.T) {
	enforcer := newTestEnforcer(t)
	auth := NewAuthorizer(enforcer, &mockUserService{})

	userID := uuid.New()
	ctx := ctxWithIdentity(userID, RoleUser)
	err := auth.AuthorizeOwnership(ctx, "vehicles", "read", userID)
	assert.NoError(t, err)
}

func TestAuthorizer_AuthorizeOwnership_OwnerMismatch(t *testing.T) {
	enforcer := newTestEnforcer(t)
	auth := NewAuthorizer(enforcer, &mockUserService{})

	userID := uuid.New()
	otherOwner := uuid.New()
	ctx := ctxWithIdentity(userID, RoleUser)
	err := auth.AuthorizeOwnership(ctx, "vehicles", "read", otherOwner)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "forbidden")
}

func TestAuthorizer_AuthorizeOwnership_NoIdentity(t *testing.T) {
	enforcer := newTestEnforcer(t)
	auth := NewAuthorizer(enforcer, &mockUserService{})

	ctx := ctxWithRole(RoleUser)
	err := auth.AuthorizeOwnership(ctx, "vehicles", "read", uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no user identity")
}

func TestAuthorizer_AuthorizeEntityMembership_AdminBypass(t *testing.T) {
	enforcer := newTestEnforcer(t)
	auth := NewAuthorizer(enforcer, &mockUserService{})

	userID := uuid.New()
	ctx := ctxWithIdentity(userID, RoleAdmin)
	err := auth.AuthorizeEntityMembership(ctx, uuid.New(), "admin")
	assert.NoError(t, err)
}

func TestAuthorizer_AuthorizeEntityMembership_RoleMatch(t *testing.T) {
	enforcer := newTestEnforcer(t)
	userID := uuid.New()
	entityID := uuid.New()

	auth := NewAuthorizer(enforcer, &mockUserService{
		getUserEntityRoleFunc: func(_ context.Context, _, _ uuid.UUID) (string, error) {
			return "admin", nil
		},
	})

	ctx := ctxWithIdentity(userID, RoleEntityMember)
	err := auth.AuthorizeEntityMembership(ctx, entityID, "admin")
	assert.NoError(t, err)
}

func TestAuthorizer_AuthorizeEntityMembership_RoleMismatch(t *testing.T) {
	enforcer := newTestEnforcer(t)
	userID := uuid.New()

	auth := NewAuthorizer(enforcer, &mockUserService{
		getUserEntityRoleFunc: func(_ context.Context, _, _ uuid.UUID) (string, error) {
			return "member", nil
		},
	})

	ctx := ctxWithIdentity(userID, RoleEntityMember)
	err := auth.AuthorizeEntityMembership(ctx, uuid.New(), "admin")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "admin role required")
}

func TestAuthorizer_AuthorizeEntityMembership_NotMember(t *testing.T) {
	enforcer := newTestEnforcer(t)
	userID := uuid.New()

	auth := NewAuthorizer(enforcer, &mockUserService{
		getUserEntityRoleFunc: func(_ context.Context, _, _ uuid.UUID) (string, error) {
			return "", assert.AnError
		},
	})

	ctx := ctxWithIdentity(userID, RoleEntityMember)
	err := auth.AuthorizeEntityMembership(ctx, uuid.New(), "")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not a member")
}

func TestIsAdmin(t *testing.T) {
	assert.True(t, IsAdmin(ctxWithRole(RoleAdmin)))
	assert.False(t, IsAdmin(ctxWithRole(RoleUser)))
	assert.False(t, IsAdmin(context.Background()))
}

func TestIsUser(t *testing.T) {
	assert.True(t, IsUser(ctxWithRole(RoleUser)))
	assert.False(t, IsUser(ctxWithRole(RoleAdmin)))
}

func TestIsOAuth2Request(t *testing.T) {
	ctx := context.WithValue(context.Background(), AuthSourceKey, AuthSourceOAuth2)
	assert.True(t, IsOAuth2Request(ctx))

	ctx2 := context.WithValue(context.Background(), AuthSourceKey, AuthSourceSession)
	assert.False(t, IsOAuth2Request(ctx2))

	assert.False(t, IsOAuth2Request(context.Background()))
}

func TestGetIdentityID(t *testing.T) {
	userID := uuid.New()
	ctx := context.WithValue(context.Background(), IdentityIDKey, userID)
	id, ok := GetIdentityID(ctx)
	assert.True(t, ok)
	assert.Equal(t, userID, id)

	_, ok = GetIdentityID(context.Background())
	assert.False(t, ok)
}

func TestGetIdentityEmail(t *testing.T) {
	ctx := context.WithValue(context.Background(), IdentityEmailKey, "test@example.com")
	email, ok := GetIdentityEmail(ctx)
	assert.True(t, ok)
	assert.Equal(t, "test@example.com", email)

	_, ok = GetIdentityEmail(context.Background())
	assert.False(t, ok)
}

// --- Scope tests ---

func TestValidateScopes_AllValid(t *testing.T) {
	err := ValidateScopes([]string{ScopeVehiclesRead, ScopeEventsWrite})
	assert.NoError(t, err)
}

func TestValidateScopes_Empty(t *testing.T) {
	err := ValidateScopes([]string{})
	assert.NoError(t, err)

	err = ValidateScopes(nil)
	assert.NoError(t, err)
}

func TestValidateScopes_Invalid(t *testing.T) {
	err := ValidateScopes([]string{ScopeVehiclesRead, "bogus:scope"})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid scope: bogus:scope")
}

func TestValidateScopes_AllKnown(t *testing.T) {
	err := ValidateScopes(AllScopes)
	assert.NoError(t, err)
}

func TestHasScope_Present(t *testing.T) {
	ctx := context.WithValue(context.Background(), OAuth2ScopesKey, []string{ScopeVehiclesRead, ScopeEventsWrite})
	assert.True(t, HasScope(ctx, ScopeVehiclesRead))
	assert.True(t, HasScope(ctx, ScopeEventsWrite))
}

func TestHasScope_Absent(t *testing.T) {
	ctx := context.WithValue(context.Background(), OAuth2ScopesKey, []string{ScopeVehiclesRead})
	assert.False(t, HasScope(ctx, ScopeEventsWrite))
}

func TestHasScope_NoScopesInContext(t *testing.T) {
	assert.False(t, HasScope(context.Background(), ScopeVehiclesRead))
}

func TestGetScopesFromContext(t *testing.T) {
	scopes := []string{ScopeVehiclesRead, ScopeCertificationsWrite}
	ctx := context.WithValue(context.Background(), OAuth2ScopesKey, scopes)

	got, ok := GetScopesFromContext(ctx)
	assert.True(t, ok)
	assert.Equal(t, scopes, got)

	_, ok = GetScopesFromContext(context.Background())
	assert.False(t, ok)
}

// --- IsEntityAdmin ---

func TestIsEntityAdmin_True(t *testing.T) {
	enforcer := newTestEnforcer(t)
	userID := uuid.New()

	auth := NewAuthorizer(enforcer, &mockUserService{
		getUserEntityRoleFunc: func(_ context.Context, _, _ uuid.UUID) (string, error) {
			return "admin", nil
		},
	})

	ctx := ctxWithIdentity(userID, RoleEntityMember)
	assert.True(t, auth.IsEntityAdmin(ctx, uuid.New()))
}

func TestIsEntityAdmin_False(t *testing.T) {
	enforcer := newTestEnforcer(t)
	userID := uuid.New()

	auth := NewAuthorizer(enforcer, &mockUserService{
		getUserEntityRoleFunc: func(_ context.Context, _, _ uuid.UUID) (string, error) {
			return "member", nil
		},
	})

	ctx := ctxWithIdentity(userID, RoleEntityMember)
	assert.False(t, auth.IsEntityAdmin(ctx, uuid.New()))
}

func TestAuthorizer_AuthorizeEntityMembership_EmptyRequiredRole(t *testing.T) {
	enforcer := newTestEnforcer(t)
	userID := uuid.New()

	auth := NewAuthorizer(enforcer, &mockUserService{
		getUserEntityRoleFunc: func(_ context.Context, _, _ uuid.UUID) (string, error) {
			return "member", nil
		},
	})

	ctx := ctxWithIdentity(userID, RoleEntityMember)
	err := auth.AuthorizeEntityMembership(ctx, uuid.New(), "")
	assert.NoError(t, err)
}

func TestAuthorizer_AuthorizeEntityMembership_NoIdentity(t *testing.T) {
	enforcer := newTestEnforcer(t)
	auth := NewAuthorizer(enforcer, &mockUserService{})

	err := auth.AuthorizeEntityMembership(context.Background(), uuid.New(), "admin")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no user identity")
}

// --- Middleware mocks ---

type mockSessionValidator struct {
	validateFunc func(ctx context.Context, cookie string) (*kratos.Session, error)
}

func (m *mockSessionValidator) ValidateSessionCookie(ctx context.Context, cookie string) (*kratos.Session, error) {
	if m.validateFunc != nil {
		return m.validateFunc(ctx, cookie)
	}
	return nil, errors.New("invalid session")
}

type mockOAuth2Validator struct {
	introspectFunc func(ctx context.Context, token string) (*hydra.OAuth2TokenIntrospection, error)
}

func (m *mockOAuth2Validator) IntrospectToken(ctx context.Context, token string) (*hydra.OAuth2TokenIntrospection, error) {
	if m.introspectFunc != nil {
		return m.introspectFunc(ctx, token)
	}
	return &hydra.OAuth2TokenIntrospection{Active: false}, nil
}

// --- Middleware tests ---

func TestMiddleware_Auth_NoCookie(t *testing.T) {
	mw := NewMiddleware(&mockSessionValidator{}, &mockUserService{})

	handler := mw.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("handler should not be called")
	}))

	req := httptest.NewRequest("GET", "/", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusUnauthorized, rr.Code)
}

func TestMiddleware_Auth_ValidSessionAdmin(t *testing.T) {
	identityID := uuid.New()
	sv := &mockSessionValidator{
		validateFunc: func(_ context.Context, _ string) (*kratos.Session, error) {
			return &kratos.Session{
				Active:     true,
				IdentityID: identityID.String(),
				Email:      "admin@test.com",
				IsAdmin:    true,
			}, nil
		},
	}
	mw := NewMiddleware(sv, &mockUserService{})

	var gotRole string
	var gotID uuid.UUID
	var gotEmail string
	handler := mw.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotRole, _ = r.Context().Value(RoleKey).(string)
		gotID, _ = GetIdentityID(r.Context())
		gotEmail, _ = GetIdentityEmail(r.Context())
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.AddCookie(&http.Cookie{Name: KratosSessionCookieName, Value: "session-value"})
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, RoleAdmin, gotRole)
	assert.Equal(t, identityID, gotID)
	assert.Equal(t, "admin@test.com", gotEmail)
}

func TestMiddleware_Auth_ValidSessionUser(t *testing.T) {
	identityID := uuid.New()
	sv := &mockSessionValidator{
		validateFunc: func(_ context.Context, _ string) (*kratos.Session, error) {
			return &kratos.Session{
				Active:     true,
				IdentityID: identityID.String(),
				Email:      "user@test.com",
				IsAdmin:    false,
			}, nil
		},
	}
	us := &mockUserService{
		getUserEntityMembershipsFunc: func(_ context.Context, _ uuid.UUID) ([]user.EntityMembership, error) {
			return nil, nil
		},
	}
	mw := NewMiddleware(sv, us)

	var gotRole string
	handler := mw.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotRole, _ = r.Context().Value(RoleKey).(string)
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.AddCookie(&http.Cookie{Name: KratosSessionCookieName, Value: "session-value"})
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, RoleUser, gotRole)
}

func TestMiddleware_Auth_ValidSessionEntityMember(t *testing.T) {
	identityID := uuid.New()
	sv := &mockSessionValidator{
		validateFunc: func(_ context.Context, _ string) (*kratos.Session, error) {
			return &kratos.Session{
				Active:     true,
				IdentityID: identityID.String(),
				IsAdmin:    false,
			}, nil
		},
	}
	us := &mockUserService{
		getUserEntityMembershipsFunc: func(_ context.Context, _ uuid.UUID) ([]user.EntityMembership, error) {
			return []user.EntityMembership{{EntityID: uuid.New(), Role: "member"}}, nil
		},
	}
	mw := NewMiddleware(sv, us)

	var gotRole string
	handler := mw.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotRole, _ = r.Context().Value(RoleKey).(string)
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.AddCookie(&http.Cookie{Name: KratosSessionCookieName, Value: "val"})
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, RoleEntityMember, gotRole)
}

func TestMiddleware_Auth_InvalidSession(t *testing.T) {
	sv := &mockSessionValidator{
		validateFunc: func(_ context.Context, _ string) (*kratos.Session, error) {
			return nil, errors.New("invalid")
		},
	}
	mw := NewMiddleware(sv, &mockUserService{})

	var called bool
	handler := mw.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.AddCookie(&http.Cookie{Name: KratosSessionCookieName, Value: "bad"})
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// Handler still called (middleware doesn't block on invalid session, it just doesn't set context)
	assert.True(t, called)
}

func TestMiddleware_Auth_InvalidIdentityID(t *testing.T) {
	sv := &mockSessionValidator{
		validateFunc: func(_ context.Context, _ string) (*kratos.Session, error) {
			return &kratos.Session{
				Active:     true,
				IdentityID: "not-a-uuid",
			}, nil
		},
	}
	mw := NewMiddleware(sv, &mockUserService{})

	handler := mw.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("should not be called")
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.AddCookie(&http.Cookie{Name: KratosSessionCookieName, Value: "val"})
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusUnauthorized, rr.Code)
}

func TestMiddleware_Auth_MembershipError(t *testing.T) {
	identityID := uuid.New()
	sv := &mockSessionValidator{
		validateFunc: func(_ context.Context, _ string) (*kratos.Session, error) {
			return &kratos.Session{Active: true, IdentityID: identityID.String(), IsAdmin: false}, nil
		},
	}
	us := &mockUserService{
		getUserEntityMembershipsFunc: func(_ context.Context, _ uuid.UUID) ([]user.EntityMembership, error) {
			return nil, errors.New("db error")
		},
	}
	mw := NewMiddleware(sv, us)

	handler := mw.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("should not be called")
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.AddCookie(&http.Cookie{Name: KratosSessionCookieName, Value: "val"})
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusUnauthorized, rr.Code)
}

func TestMiddleware_Auth_OAuth2Success(t *testing.T) {
	entityID := uuid.New()
	ov := &mockOAuth2Validator{
		introspectFunc: func(_ context.Context, _ string) (*hydra.OAuth2TokenIntrospection, error) {
			return &hydra.OAuth2TokenIntrospection{
				Active:   true,
				ClientID: "client-123",
				Scopes:   []string{ScopeVehiclesRead},
				EntityID: entityID,
			}, nil
		},
	}
	mw := NewMiddlewareWithOAuth2(&mockSessionValidator{}, ov, &mockUserService{})

	var gotRole, gotSource, gotClientID string
	var gotEntityID uuid.UUID
	var gotScopes []string
	handler := mw.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotRole, _ = r.Context().Value(RoleKey).(string)
		gotSource, _ = r.Context().Value(AuthSourceKey).(string)
		gotClientID, _ = r.Context().Value(OAuth2ClientIDKey).(string)
		gotScopes, _ = r.Context().Value(OAuth2ScopesKey).([]string)
		gotEntityID, _ = r.Context().Value(OAuth2EntityIDKey).(uuid.UUID)
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, RoleEntityMember, gotRole)
	assert.Equal(t, AuthSourceOAuth2, gotSource)
	assert.Equal(t, "client-123", gotClientID)
	assert.Equal(t, []string{ScopeVehiclesRead}, gotScopes)
	assert.Equal(t, entityID, gotEntityID)
}

func TestMiddleware_Auth_OAuth2InactiveTokenFallsToSession(t *testing.T) {
	ov := &mockOAuth2Validator{
		introspectFunc: func(_ context.Context, _ string) (*hydra.OAuth2TokenIntrospection, error) {
			return &hydra.OAuth2TokenIntrospection{Active: false}, nil
		},
	}
	mw := NewMiddlewareWithOAuth2(&mockSessionValidator{}, ov, &mockUserService{})

	handler := mw.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("should not reach handler without cookie")
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer inactive-token")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusUnauthorized, rr.Code)
}

func TestMiddleware_Auth_OAuth2ErrorFallsToSession(t *testing.T) {
	ov := &mockOAuth2Validator{
		introspectFunc: func(_ context.Context, _ string) (*hydra.OAuth2TokenIntrospection, error) {
			return nil, errors.New("introspection failed")
		},
	}
	mw := NewMiddlewareWithOAuth2(&mockSessionValidator{}, ov, &mockUserService{})

	handler := mw.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer bad-token")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// Falls back to session, no cookie → 401
	assert.Equal(t, http.StatusUnauthorized, rr.Code)
}

func TestExtractBearerToken(t *testing.T) {
	mw := &Middleware{}

	tests := []struct {
		name   string
		header string
		want   string
	}{
		{"valid bearer", "Bearer abc123", "abc123"},
		{"empty", "", ""},
		{"no bearer prefix", "Token abc123", ""},
		{"bearer only", "Bearer", ""},
		{"lowercase", "bearer abc123", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/", nil)
			if tt.header != "" {
				req.Header.Set("Authorization", tt.header)
			}
			assert.Equal(t, tt.want, mw.extractBearerToken(req))
		})
	}
}
