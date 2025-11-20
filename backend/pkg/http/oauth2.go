package http

import (
	"context"

	"github.com/s1moe2/classics-chain/auth"
	"github.com/s1moe2/classics-chain/entity"
	"github.com/s1moe2/classics-chain/pkg/hydra"
)

// ListEntityOAuth2Clients lists OAuth2 clients for an entity
func (a apiServer) ListEntityOAuth2Clients(ctx context.Context, request ListEntityOAuth2ClientsRequestObject) (ListEntityOAuth2ClientsResponseObject, error) {
	if err := a.authorizer.AuthorizeEntityMembership(ctx, request.EntityId, "admin"); err != nil {
		return ListEntityOAuth2Clients403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{Error: "insufficient permissions"},
		}, nil
	}

	clients, err := a.entityService.ListClientsForEntity(ctx, request.EntityId)
	if err != nil {
		return nil, err
	}

	httpClients := make([]OAuth2Client, len(clients))
	for i, client := range clients {
		httpClients[i] = domainToHTTPOAuth2Client(client)
	}

	return ListEntityOAuth2Clients200JSONResponse(
		OAuth2ClientListResponse{
			Data: httpClients,
		},
	), nil
}

// CreateEntityOAuth2Client creates an OAuth2 client for an entity
func (a apiServer) CreateEntityOAuth2Client(ctx context.Context, request CreateEntityOAuth2ClientRequestObject) (CreateEntityOAuth2ClientResponseObject, error) {
	if request.Body == nil {
		return CreateEntityOAuth2Client400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{Error: "Request body is required"},
		}, nil
	}

	if len(request.Body.Scopes) == 0 {
		return CreateEntityOAuth2Client400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{Error: "At least one scope is required"},
		}, nil
	}

	userID, ok := auth.GetIdentityID(ctx)
	if !ok {
		return CreateEntityOAuth2Client401JSONResponse{
			UnauthorizedJSONResponse: UnauthorizedJSONResponse{Error: "User not authenticated"},
		}, nil
	}

	if err := a.authorizer.AuthorizeEntityMembership(ctx, request.EntityId, "admin"); err != nil {
		return CreateEntityOAuth2Client403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{Error: "insufficient permissions"},
		}, nil
	}

	params := entity.CreateClientParams{
		EntityID:    request.EntityId,
		CreatedBy:   userID,
		Description: *request.Body.Description,
		Scopes:      request.Body.Scopes,
	}

	client, err := a.entityService.CreateClientForEntity(ctx, request.EntityId, params)
	if err != nil {
		return CreateEntityOAuth2Client400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{Error: err.Error()},
		}, nil
	}

	return CreateEntityOAuth2Client201JSONResponse(
		domainToHTTPOAuth2ClientWithSecret(*client),
	), nil
}

// DeleteEntityOAuth2Client deletes an OAuth2 client for an entity
func (a apiServer) DeleteEntityOAuth2Client(ctx context.Context, request DeleteEntityOAuth2ClientRequestObject) (DeleteEntityOAuth2ClientResponseObject, error) {
	if err := a.authorizer.AuthorizeEntityMembership(ctx, request.EntityId, "admin"); err != nil {
		return DeleteEntityOAuth2Client403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{Error: "insufficient permissions"},
		}, nil
	}

	err := a.entityService.DeleteClientForEntity(ctx, request.EntityId, request.ClientId)
	if err != nil {
		return DeleteEntityOAuth2Client404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{Error: err.Error()},
		}, nil
	}

	return DeleteEntityOAuth2Client204Response{}, nil
}

// GetEntityOAuth2Client retrieves an OAuth2 client for an entity
func (a apiServer) GetEntityOAuth2Client(ctx context.Context, request GetEntityOAuth2ClientRequestObject) (GetEntityOAuth2ClientResponseObject, error) {
	if err := a.authorizer.AuthorizeEntityMembership(ctx, request.EntityId, "admin"); err != nil {
		return GetEntityOAuth2Client403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{Error: "insufficient permissions"},
		}, nil
	}

	client, err := a.entityService.GetClientForEntity(ctx, request.EntityId, request.ClientId)
	if err != nil {
		return GetEntityOAuth2Client404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{Error: err.Error()},
		}, nil
	}

	return GetEntityOAuth2Client200JSONResponse(
		domainToHTTPOAuth2Client(*client),
	), nil
}

func domainToHTTPOAuth2Client(hClient hydra.OAuth2Client) OAuth2Client {
	updatedAt := hClient.UpdatedAt
	return OAuth2Client{
		ClientId:    hClient.ClientID,
		EntityId:    hClient.EntityID,
		EntityName:  &hClient.EntityName,
		Description: &hClient.Description,
		Scopes:      hClient.Scopes,
		CreatedAt:   hClient.CreatedAt,
		UpdatedAt:   &updatedAt,
	}
}

func domainToHTTPOAuth2ClientWithSecret(hClient hydra.OAuth2Client) OAuth2ClientWithSecret {
	updatedAt := hClient.UpdatedAt
	return OAuth2ClientWithSecret{
		ClientId:     hClient.ClientID,
		ClientSecret: hClient.ClientSecret,
		EntityId:     hClient.EntityID,
		EntityName:   &hClient.EntityName,
		Description:  &hClient.Description,
		Scopes:       hClient.Scopes,
		CreatedAt:    hClient.CreatedAt,
		UpdatedAt:    &updatedAt,
	}
}
