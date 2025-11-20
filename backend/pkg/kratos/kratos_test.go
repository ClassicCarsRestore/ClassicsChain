package kratos

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	kratos "github.com/ory/kratos-client-go"
)

func TestNew(t *testing.T) {
	publicURL := "http://localhost:4433"
	adminURL := "http://localhost:4434"

	client := New(publicURL, adminURL)

	if client == nil {
		t.Fatal("expected client to be non-nil")
	}
	if client.frontend == nil {
		t.Error("expected frontend client to be non-nil")
	}
	if client.admin == nil {
		t.Error("expected admin client to be non-nil")
	}
}

func TestValidateSessionCookie_Success(t *testing.T) {
	active := true
	identityID := "test-identity-id"
	mockSession := &kratos.Session{
		Active: &active,
		Identity: &kratos.Identity{
			Id: identityID,
			Traits: map[string]interface{}{
				"email": "test@example.com",
			},
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/sessions/whoami" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}

		cookie := r.Header.Get("Cookie")
		if cookie != "ory_kratos_session=valid-cookie" {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid cookie"})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(mockSession)
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	ctx := context.Background()

	session, err := client.ValidateSessionCookie(ctx, "ory_kratos_session=valid-cookie")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if session == nil {
		t.Fatal("expected session to be non-nil")
	}
	if !session.Active {
		t.Error("expected session to be active")
	}
	if session.IdentityID != identityID {
		t.Errorf("expected identity ID %s, got %s", identityID, session.IdentityID)
	}
}

func TestValidateSessionCookie_InvalidCookie(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid cookie"})
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	ctx := context.Background()

	session, err := client.ValidateSessionCookie(ctx, "invalid-cookie")
	if err == nil {
		t.Fatal("expected error for invalid cookie")
	}
	if session != nil {
		t.Error("expected session to be nil")
	}
}

func TestGetUser_Success(t *testing.T) {
	mockIdentity := &kratos.Identity{
		Id: "test-identity-id",
		Traits: map[string]interface{}{
			"email": "test@example.com",
		},
		MetadataPublic: map[string]interface{}{
			"isAdmin": true,
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/admin/identities/test-identity-id" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(mockIdentity)
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	ctx := context.Background()

	user, err := client.GetUser(ctx, "test-identity-id")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if user == nil {
		t.Fatal("expected user to be non-nil")
	}
	if user.ID != "test-identity-id" {
		t.Errorf("expected user ID %s, got %s", "test-identity-id", user.ID)
	}
	if user.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", user.Email)
	}
	if !user.IsAdmin {
		t.Error("expected user to be admin")
	}
}

func TestGetUser_NotFound(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "identity not found"})
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	ctx := context.Background()

	user, err := client.GetUser(ctx, "nonexistent-id")
	if err == nil {
		t.Fatal("expected error for nonexistent user")
	}
	if user != nil {
		t.Error("expected user to be nil")
	}
}
