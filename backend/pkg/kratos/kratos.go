package kratos

import (
	"context"
	"fmt"
	"time"

	kclient "github.com/ory/kratos-client-go"
)

const schemaID = "default"

// Domain-specific types

// CreateUserParams contains parameters for creating a new user
type CreateUserParams struct {
	Email    string
	Name     *string
	IsAdmin  bool
	Password *string
}

// UpdateUserParams contains parameters for updating a user (partial updates supported via pointers)
type UpdateUserParams struct {
	Email   *string
	Name    *string
	IsAdmin *bool
}

// UserIdentity represents a user in domain terms (not Kratos-specific)
type UserIdentity struct {
	ID      string
	Email   string
	Name    *string
	IsAdmin bool
}

// GetID returns the user ID
func (u *UserIdentity) GetID() string {
	return u.ID
}

// GetEmail returns the user email
func (u *UserIdentity) GetEmail() string {
	return u.Email
}

// GetName returns the user name
func (u *UserIdentity) GetName() *string {
	return u.Name
}

// Session represents an authenticated user session
type Session struct {
	ID         string
	Active     bool
	IdentityID string
	Email      string
	IsAdmin    bool
	ExpiresAt  time.Time
	IssuedAt   time.Time
}

// Client wraps the Kratos SDK client
type Client struct {
	frontend *kclient.APIClient
	admin    *kclient.APIClient
}

// New creates a new Kratos client
func New(publicURL, adminURL string) *Client {
	frontendConfig := kclient.NewConfiguration()
	frontendConfig.Servers = kclient.ServerConfigurations{{URL: publicURL}}

	adminConfig := kclient.NewConfiguration()
	adminConfig.Servers = kclient.ServerConfigurations{{URL: adminURL}}

	return &Client{
		frontend: kclient.NewAPIClient(frontendConfig),
		admin:    kclient.NewAPIClient(adminConfig),
	}
}

// ValidateSessionCookie validates a session from cookie header
func (k *Client) ValidateSessionCookie(ctx context.Context, cookie string) (*Session, error) {
	ksession, resp, err := k.frontend.FrontendAPI.ToSession(ctx).
		Cookie(cookie).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("validate session cookie: %w", err)
	}
	defer resp.Body.Close()

	if ksession.Active == nil || !*ksession.Active {
		return nil, fmt.Errorf("session is not active")
	}

	return k.toSession(ksession), nil
}

// GetUser retrieves a user by ID
func (k *Client) GetUser(ctx context.Context, userID string) (*UserIdentity, error) {
	identity, resp, err := k.admin.IdentityAPI.GetIdentity(ctx, userID).Execute()
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	defer resp.Body.Close()

	return k.toUserIdentity(identity), nil
}

// ListAdminUsers lists all users with admin privileges
func (k *Client) ListAdminUsers(ctx context.Context) ([]UserIdentity, error) {
	identities, resp, err := k.admin.IdentityAPI.ListIdentities(ctx).
		PageSize(250).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("list admin users: %w", err)
	}
	defer resp.Body.Close()

	var adminUsers []UserIdentity
	for _, identity := range identities {
		user := k.toUserIdentity(&identity)
		if user.IsAdmin {
			adminUsers = append(adminUsers, *user)
		}
	}
	return adminUsers, nil
}

// CreateUser creates a new user in Kratos
func (k *Client) CreateUser(ctx context.Context, params CreateUserParams) (*UserIdentity, error) {
	traits := k.buildTraits(params.Email, params.Name)
	metadata := map[string]interface{}{
		"isAdmin": params.IsAdmin,
	}

	body := kclient.CreateIdentityBody{
		SchemaId:       schemaID,
		Traits:         traits,
		MetadataPublic: metadata,
	}

	if params.Password != nil && *params.Password != "" {
		body.Credentials = map[string]interface{}{
			"password": map[string]interface{}{
				"config": map[string]interface{}{
					"password": *params.Password,
				},
			},
		}
	}

	identity, resp, err := k.admin.IdentityAPI.CreateIdentity(ctx).
		CreateIdentityBody(body).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	defer resp.Body.Close()

	return k.toUserIdentity(identity), nil
}

// UpdateUser updates an existing user in Kratos
// Fields set to nil are not updated
func (k *Client) UpdateUser(ctx context.Context, userID string, params UpdateUserParams) (*UserIdentity, error) {
	identity, resp, err := k.admin.IdentityAPI.GetIdentity(ctx, userID).Execute()
	if err != nil {
		resp.Body.Close()
		return nil, fmt.Errorf("get user for update: %w", err)
	}
	resp.Body.Close()

	// Build update traits from current state
	traits := k.buildTraitsFromCurrent(identity, params.Email, params.Name)

	// Build update metadata from current state
	metadata := make(map[string]interface{})
	if identity.MetadataPublic != nil {
		if metadataMap, ok := identity.MetadataPublic.(map[string]interface{}); ok {
			metadata = metadataMap
		}
	}
	if params.IsAdmin != nil {
		metadata["isAdmin"] = *params.IsAdmin
	}

	body := kclient.UpdateIdentityBody{
		SchemaId:       identity.SchemaId,
		Traits:         traits,
		MetadataPublic: metadata,
	}

	updated, resp2, err := k.admin.IdentityAPI.UpdateIdentity(ctx, userID).
		UpdateIdentityBody(body).
		Execute()
	if err != nil {
		resp2.Body.Close()
		return nil, fmt.Errorf("update user: %w", err)
	}
	defer resp2.Body.Close()

	return k.toUserIdentity(updated), nil
}

// TriggerRecoveryForUser triggers a browser recovery flow for a user
// This causes Kratos to automatically send a recovery email via the configured courier
func (k *Client) TriggerRecoveryForUser(ctx context.Context, email string) error {
	// Step 1: Create a browser recovery flow
	flow, resp, err := k.frontend.FrontendAPI.CreateBrowserRecoveryFlow(ctx).Execute()
	if err != nil {
		return fmt.Errorf("create browser recovery flow: %w", err)
	}

	// Extract cookies from the response
	cookies := resp.Header.Get("Set-Cookie")
	resp.Body.Close()

	// Step 2: Get CSRF token from the flow
	var csrfToken string
	for _, node := range flow.Ui.Nodes {
		if node.Attributes.UiNodeInputAttributes != nil {
			attrs := node.Attributes.UiNodeInputAttributes
			if attrs.Name == "csrf_token" {
				if value, ok := attrs.Value.(string); ok {
					csrfToken = value
					break
				}
			}
		}
	}

	if csrfToken == "" {
		return fmt.Errorf("csrf token not found in recovery flow")
	}

	// Step 3: Submit the email to trigger recovery email sending
	// Use "code" method for passwordless verification via email code
	// Include the cookies from the flow creation to pass CSRF validation
	updateBody := kclient.UpdateRecoveryFlowBody{
		UpdateRecoveryFlowWithCodeMethod: &kclient.UpdateRecoveryFlowWithCodeMethod{
			Email:     kclient.PtrString(email),
			Method:    "code",
			CsrfToken: kclient.PtrString(csrfToken),
		},
	}

	_, resp2, err := k.frontend.FrontendAPI.UpdateRecoveryFlow(ctx).
		Flow(flow.Id).
		UpdateRecoveryFlowBody(updateBody).
		Cookie(cookies).
		Execute()
	if err != nil {
		return fmt.Errorf("update recovery flow: %w", err)
	}
	defer resp2.Body.Close()

	return nil
}

// Helper functions (Kratos-specific knowledge contained here)

func (k *Client) toUserIdentity(identity *kclient.Identity) *UserIdentity {
	email := k.extractEmailFromTraits(identity.Traits)
	name := k.extractNameFromTraits(identity.Traits)
	isAdmin := k.extractIsAdminFromMetadata(identity.MetadataPublic)

	return &UserIdentity{
		ID:      identity.Id,
		Email:   email,
		Name:    name,
		IsAdmin: isAdmin,
	}
}

func (k *Client) toSession(ksession *kclient.Session) *Session {
	session := &Session{
		ID:         ksession.Id,
		Active:     *ksession.Active,
		IdentityID: ksession.Identity.Id,
		Email:      k.extractEmailFromTraits(ksession.Identity.Traits),
		IsAdmin:    k.extractIsAdminFromMetadata(ksession.Identity.MetadataPublic),
	}

	if ksession.ExpiresAt != nil {
		session.ExpiresAt = *ksession.ExpiresAt
	}
	if ksession.IssuedAt != nil {
		session.IssuedAt = *ksession.IssuedAt
	}

	return session
}

func (k *Client) buildTraits(email string, name *string) map[string]interface{} {
	traits := map[string]interface{}{
		"email": email,
	}

	if name != nil && *name != "" {
		traits["name"] = map[string]interface{}{
			"first": *name,
		}
	}

	return traits
}

func (k *Client) buildTraitsFromCurrent(identity *kclient.Identity, email *string, name *string) map[string]interface{} {
	traits := make(map[string]interface{})
	if identity.Traits != nil {
		if traitsMap, ok := identity.Traits.(map[string]interface{}); ok {
			// Copy current traits
			for k, v := range traitsMap {
				traits[k] = v
			}
		}
	}

	if email != nil {
		traits["email"] = *email
	}

	if name != nil {
		if *name == "" {
			delete(traits, "name")
		} else {
			traits["name"] = map[string]interface{}{
				"first": *name,
			}
		}
	}

	return traits
}

func (k *Client) extractEmailFromTraits(traits interface{}) string {
	if traitsMap, ok := traits.(map[string]interface{}); ok {
		if email, ok := traitsMap["email"].(string); ok {
			return email
		}
	}
	return ""
}

func (k *Client) extractNameFromTraits(traits interface{}) *string {
	if traitsMap, ok := traits.(map[string]interface{}); ok {
		if nameData, ok := traitsMap["name"].(map[string]interface{}); ok {
			if first, ok := nameData["first"].(string); ok && first != "" {
				return &first
			}
		}
	}
	return nil
}

func (k *Client) extractIsAdminFromMetadata(metadata interface{}) bool {
	if metadataMap, ok := metadata.(map[string]interface{}); ok {
		if isAdmin, ok := metadataMap["isAdmin"].(bool); ok {
			return isAdmin
		}
	}
	return false
}
