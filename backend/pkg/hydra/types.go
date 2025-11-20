package hydra

import (
	"time"

	"github.com/google/uuid"
)

// OAuth2Client represents an OAuth2 client in domain terms
type OAuth2Client struct {
	ClientID     string
	ClientSecret string
	EntityID     uuid.UUID
	EntityName   string
	CreatedBy    uuid.UUID
	Description  string
	Scopes       []string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// CreateClientParams contains parameters for creating an OAuth2 client
type CreateClientParams struct {
	EntityID    uuid.UUID
	EntityName  string
	CreatedBy   uuid.UUID
	Description string
	Scopes      []string
}

// OAuth2TokenIntrospection represents the result of token introspection
type OAuth2TokenIntrospection struct {
	Active    bool
	ClientID  string
	Scopes    []string
	EntityID  uuid.UUID
	ExpiresAt *time.Time
}

// ClientMetadata contains metadata stored in Hydra for the client
type ClientMetadata struct {
	EntityID    string `json:"entity_id"`
	EntityName  string `json:"entity_name"`
	CreatedBy   string `json:"created_by"`
	Description string `json:"description"`
}
