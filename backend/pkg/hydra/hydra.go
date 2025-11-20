package hydra

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	hclient "github.com/ory/hydra-client-go"
)

type Client struct {
	admin hclient.AdminApi
}

// New creates a new Hydra client
func New(adminURL string) *Client {
	config := hclient.NewConfiguration()
	config.Servers = hclient.ServerConfigurations{{URL: adminURL}}
	apiClient := hclient.NewAPIClient(config)

	return &Client{
		admin: apiClient.AdminApi,
	}
}

// CreateClientCredentialsClient creates a new OAuth2 client with client credentials flow
func (h *Client) CreateClientCredentialsClient(ctx context.Context, params CreateClientParams) (*OAuth2Client, error) {
	metadata := ClientMetadata{
		EntityID:    params.EntityID.String(),
		EntityName:  params.EntityName,
		CreatedBy:   params.CreatedBy.String(),
		Description: params.Description,
	}

	metadataBytes, err := json.Marshal(metadata)
	if err != nil {
		return nil, fmt.Errorf("marshal metadata: %w", err)
	}

	metadataObj := make(map[string]interface{})
	err = json.Unmarshal(metadataBytes, &metadataObj)
	if err != nil {
		return nil, fmt.Errorf("unmarshal metadata: %w", err)
	}

	clientRequest := *hclient.NewOAuth2Client()
	clientRequest.SetClientName(params.Description)
	clientRequest.SetGrantTypes([]string{"client_credentials"})
	clientRequest.SetScope(strings.Join(params.Scopes, " "))
	clientRequest.SetMetadata(metadataObj)

	created, _, err := h.admin.CreateOAuth2Client(ctx).OAuth2Client(clientRequest).Execute()
	if err != nil {
		return nil, fmt.Errorf("create oauth2 client: %w", err)
	}

	entityID, _ := uuid.Parse(metadata.EntityID)
	createdBy, _ := uuid.Parse(metadata.CreatedBy)

	scopes := []string{}
	if scope := created.GetScope(); scope != "" {
		scopes = strings.Fields(scope)
	}

	createdAt := time.Now()
	if created.CreatedAt != nil {
		createdAt = *created.CreatedAt
	}

	return &OAuth2Client{
		ClientID:     *created.ClientId,
		ClientSecret: *created.ClientSecret,
		EntityID:     entityID,
		EntityName:   metadata.EntityName,
		CreatedBy:    createdBy,
		Description:  metadata.Description,
		Scopes:       scopes,
		CreatedAt:    createdAt,
		UpdatedAt:    time.Now(),
	}, nil
}

// DeleteClient deletes an OAuth2 client
func (h *Client) DeleteClient(ctx context.Context, clientID string) error {
	_, err := h.admin.DeleteOAuth2Client(ctx, clientID).Execute()
	if err != nil {
		return fmt.Errorf("delete oauth2 client: %w", err)
	}

	return nil
}

// GetClient retrieves a single OAuth2 client
func (h *Client) GetClient(ctx context.Context, clientID string) (*OAuth2Client, error) {
	client, _, err := h.admin.GetOAuth2Client(ctx, clientID).Execute()
	if err != nil {
		return nil, fmt.Errorf("get oauth2 client: %w", err)
	}

	return h.toOAuth2Client(client), nil
}

// ListClients retrieves all OAuth2 clients
func (h *Client) ListClients(ctx context.Context) ([]OAuth2Client, error) {
	clients, _, err := h.admin.ListOAuth2Clients(ctx).Execute()
	if err != nil {
		return nil, fmt.Errorf("list oauth2 clients: %w", err)
	}

	var result []OAuth2Client
	for _, client := range clients {
		result = append(result, *h.toOAuth2Client(&client))
	}

	return result, nil
}

// ListClientsByEntity retrieves all OAuth2 clients for a specific entity
func (h *Client) ListClientsByEntity(ctx context.Context, entityID uuid.UUID) ([]OAuth2Client, error) {
	allClients, err := h.ListClients(ctx)
	if err != nil {
		return nil, err
	}

	var result []OAuth2Client
	for _, client := range allClients {
		if client.EntityID == entityID {
			result = append(result, client)
		}
	}

	return result, nil
}

// IntrospectToken validates an OAuth2 access token
func (h *Client) IntrospectToken(ctx context.Context, token string) (*OAuth2TokenIntrospection, error) {
	result, _, err := h.admin.IntrospectOAuth2Token(ctx).Token(token).Execute()
	if err != nil {
		return nil, fmt.Errorf("introspect token: %w", err)
	}

	if !result.Active {
		return &OAuth2TokenIntrospection{Active: false}, nil
	}

	client, _, err := h.admin.GetOAuth2Client(ctx, result.GetClientId()).Execute()
	if err != nil {
		return nil, fmt.Errorf("get oauth2 client: %w", err)
	}

	// Extract entity ID from token metadata
	var metadata ClientMetadata
	var entityID uuid.UUID
	if client.Metadata != nil {
		if extBytes, err := json.Marshal(client.Metadata); err == nil {
			// TODO do not ignore error
			json.Unmarshal(extBytes, &metadata)
			if id, err := uuid.Parse(metadata.EntityID); err == nil {
				entityID = id
			}
		}
	}

	scopes := []string{}
	if result.Scope != nil && *result.Scope != "" {
		scopes = strings.Fields(*result.Scope)
	}

	var expiresAt *time.Time
	if result.Exp != nil {
		t := time.Unix(*result.Exp, 0)
		expiresAt = &t
	}

	return &OAuth2TokenIntrospection{
		Active:    true,
		ClientID:  *result.ClientId,
		Scopes:    scopes,
		EntityID:  entityID,
		ExpiresAt: expiresAt,
	}, nil
}

func (h *Client) toOAuth2Client(client *hclient.OAuth2Client) *OAuth2Client {
	var metadata ClientMetadata
	if client.Metadata != nil {
		if metadataBytes, err := json.Marshal(client.Metadata); err == nil {
			// TODO do not ignore error
			json.Unmarshal(metadataBytes, &metadata)
		}
	}

	// TODO do not ignore error
	entityID, _ := uuid.Parse(metadata.EntityID)
	createdBy, _ := uuid.Parse(metadata.CreatedBy)

	scopes := []string{}
	if scope := client.GetScope(); scope != "" {
		scopes = strings.Fields(scope)
	}

	createdAt := time.Time{}
	if client.CreatedAt != nil {
		createdAt = *client.CreatedAt
	}

	return &OAuth2Client{
		ClientID:    *client.ClientId,
		EntityID:    entityID,
		EntityName:  metadata.EntityName,
		CreatedBy:   createdBy,
		Description: metadata.Description,
		Scopes:      scopes,
		CreatedAt:   createdAt,
		UpdatedAt:   time.Now(),
	}
}
