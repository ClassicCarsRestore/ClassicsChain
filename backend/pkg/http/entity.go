package http

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
	"github.com/s1moe2/classics-chain/auth"
	"github.com/s1moe2/classics-chain/documents"
	"github.com/s1moe2/classics-chain/entity"
)

// authorizeEntityMemberAccess checks if user can access/manage members of an entity.
// For regular entities, user must be an admin of the entity or a member (for read access) or admin (for write access).
// For partners, user can also access members if they are an admin of the certifying entity.
// requireAdmin: if true, user must be an admin; if false, regular members can also access (for reading).
func (a apiServer) authorizeEntityMemberAccess(ctx context.Context, entityID uuid.UUID, requireAdmin bool) error {
	// Admins always have permission
	if auth.IsAdmin(ctx) {
		return nil
	}

	// First, check if user is a member (or admin if required) of the entity
	roleRequired := ""
	if requireAdmin {
		roleRequired = EntityRoleAdmin
	}

	if err := a.authorizer.AuthorizeEntityMembership(ctx, entityID, roleRequired); err == nil {
		return nil
	}

	// If not member/admin of entity, check if this is a partner and user is its certifier admin
	ent, err := a.entityService.GetByID(ctx, entityID)
	if err != nil {
		if requireAdmin {
			return fmt.Errorf("forbidden: must be admin of entity to manage members")
		}
		return fmt.Errorf("forbidden: must be member of entity to view members")
	}

	// If it's a partner, check if user is an admin of the certifying entity
	if ent.Type == entity.TypePartner && ent.CertifiedBy != nil {
		return a.authorizer.AuthorizeEntityMembership(ctx, *ent.CertifiedBy, EntityRoleAdmin)
	}

	if requireAdmin {
		return fmt.Errorf("forbidden: must be admin of entity to manage members")
	}
	return fmt.Errorf("forbidden: must be member of entity to view members")
}

func (a apiServer) GetEntities(ctx context.Context, request GetEntitiesRequestObject) (GetEntitiesResponseObject, error) {
	limit := 20
	offset := 0
	if request.Params.Limit != nil {
		limit = *request.Params.Limit
	}
	if request.Params.Page != nil {
		offset = (*request.Params.Page - 1) * limit
	}

	var entityType *entity.EntityType
	if request.Params.Type != nil {
		domainType := entity.EntityType(*request.Params.Type)
		entityType = &domainType
	}

	entities, total, err := a.entityService.GetAll(ctx, limit, offset, entityType)
	if err != nil {
		return nil, err
	}

	httpEntities := make([]Entity, len(entities))
	for i, ent := range entities {
		httpEntities[i] = domainToHTTPEntity(ent)
	}

	return GetEntities200JSONResponse{
		Data: httpEntities,
		Meta: PaginationMeta{
			Page:       (offset / limit) + 1,
			Limit:      limit,
			Total:      total,
			TotalPages: (total + limit - 1) / limit,
		},
	}, nil
}

func (a apiServer) GetPublicEntities(ctx context.Context, request GetPublicEntitiesRequestObject) (GetPublicEntitiesResponseObject, error) {
	limit := 20
	offset := 0
	if request.Params.Limit != nil {
		limit = *request.Params.Limit
	}
	if request.Params.Page != nil {
		offset = (*request.Params.Page - 1) * limit
	}

	var entityType *entity.EntityType
	if request.Params.Type != nil {
		domainType := entity.EntityType(*request.Params.Type)
		entityType = &domainType
	}

	entities, total, err := a.entityService.GetAll(ctx, limit, offset, entityType)
	if err != nil {
		return nil, err
	}

	httpEntities := make([]PublicEntity, len(entities))
	for i, ent := range entities {
		httpEntities[i] = domainToHTTPPublicEntity(ent)
	}

	return GetPublicEntities200JSONResponse{
		Data: httpEntities,
		Meta: PaginationMeta{
			Page:       (offset / limit) + 1,
			Limit:      limit,
			Total:      total,
			TotalPages: (total + limit - 1) / limit,
		},
	}, nil
}

func (a apiServer) CreateEntity(ctx context.Context, request CreateEntityRequestObject) (CreateEntityResponseObject, error) {
	if request.Body == nil {
		return CreateEntity400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Request body is required",
			},
		}, nil
	}

	// Check authorization based on entity type being created
	entityType := entity.EntityType(request.Body.Type)
	var resource string
	if entityType == entity.TypeCertifier {
		resource = ResourceCertifiers
	} else if entityType == entity.TypePartner {
		resource = ResourcePartners
	} else {
		return CreateEntity400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "invalid entity type",
			},
		}, nil
	}

	if err := a.authorizer.Authorize(ctx, resource, ActionCreate); err != nil {
		return CreateEntity403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	// Get user identity to set certifiedBy for partners
	var certifiedBy *uuid.UUID
	if entityType == entity.TypePartner {
		userID, ok := auth.GetIdentityID(ctx)
		if !ok {
			return CreateEntity403JSONResponse{
				ForbiddenJSONResponse: ForbiddenJSONResponse{
					Error: "forbidden",
				},
			}, nil
		}

		// If user is entity member, find which certifier entity they belong to
		if !auth.IsAdmin(ctx) {
			memberships, err := a.entityService.GetUserMemberships(ctx, userID)
			if err != nil {
				return nil, err
			}

			// Find first certifier entity where user is admin
			for _, m := range memberships {
				if m.Role == EntityRoleAdmin {
					certEntity, err := a.entityService.GetByID(ctx, m.EntityID)
					if err == nil && certEntity != nil && certEntity.Type == entity.TypeCertifier {
						certifiedBy = &m.EntityID
						break
					}
				}
			}

			if certifiedBy == nil {
				return CreateEntity403JSONResponse{
					ForbiddenJSONResponse: ForbiddenJSONResponse{
						Error: "forbidden",
					},
				}, nil
			}
		}
		// For admins creating partners, certifiedBy can be nil (platform-level trust)
	}

	params := entity.CreateEntityParams{
		Name:         request.Body.Name,
		Type:         entityType,
		Description:  request.Body.Description,
		ContactEmail: string(request.Body.ContactEmail),
		Website:      request.Body.Website,
		Address:      httpToDomainAddress(request.Body.Address),
		CertifiedBy:  certifiedBy,
	}

	createdEntity, err := a.entityService.Create(ctx, params)
	if err != nil {
		return nil, err
	}

	httpEntity := domainToHTTPEntity(*createdEntity)
	return CreateEntity201JSONResponse(httpEntity), nil
}

func (a apiServer) GetEntity(ctx context.Context, request GetEntityRequestObject) (GetEntityResponseObject, error) {
	ent, err := a.entityService.GetByID(ctx, request.EntityId)
	if err != nil {
		if errors.Is(err, entity.ErrEntityNotFound) {
			return GetEntity404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "Entity not found",
				},
			}, nil
		}
		return nil, err
	}

	httpEntity := domainToHTTPEntity(*ent)
	return GetEntity200JSONResponse(httpEntity), nil
}

func (a apiServer) UpdateEntity(ctx context.Context, request UpdateEntityRequestObject) (UpdateEntityResponseObject, error) {
	if request.Body == nil {
		return UpdateEntity400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Request body is required",
			},
		}, nil
	}

	// Check authorization - user must have entities:update permission
	if err := a.authorizer.Authorize(ctx, ResourceEntities, ActionUpdate); err != nil {
		return UpdateEntity403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	// For entity_managers, verify they are members of the entity being updated
	if !auth.IsAdmin(ctx) {
		if err := a.authorizer.AuthorizeEntityMembership(ctx, request.EntityId, ""); err != nil {
			return UpdateEntity403JSONResponse{
				ForbiddenJSONResponse: ForbiddenJSONResponse{
					Error: "forbidden",
				},
			}, nil
		}
	}

	var contactEmail *string
	if request.Body.ContactEmail != nil {
		emailStr := string(*request.Body.ContactEmail)
		contactEmail = &emailStr
	}

	params := entity.UpdateEntityParams{
		Name:         request.Body.Name,
		Description:  request.Body.Description,
		ContactEmail: contactEmail,
		Website:      request.Body.Website,
		Address:      httpToDomainAddress(request.Body.Address),
	}

	updatedEntity, err := a.entityService.Update(ctx, request.EntityId, params)
	if err != nil {
		if errors.Is(err, entity.ErrEntityNotFound) {
			return UpdateEntity404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "Entity not found",
				},
			}, nil
		}
		return nil, err
	}

	httpEntity := domainToHTTPEntity(*updatedEntity)
	return UpdateEntity200JSONResponse(httpEntity), nil
}

func (a apiServer) DeleteEntity(ctx context.Context, request DeleteEntityRequestObject) (DeleteEntityResponseObject, error) {
	// Check authorization - user must be admin
	if !auth.IsAdmin(ctx) {
		return DeleteEntity403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	err := a.entityService.Delete(ctx, request.EntityId)
	if err != nil {
		if errors.Is(err, entity.ErrEntityNotFound) {
			return DeleteEntity404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "Entity not found",
				},
			}, nil
		}
		return nil, err
	}

	return DeleteEntity204Response{}, nil
}

// domainToHTTPEntity converts a domain entity to HTTP entity
func domainToHTTPEntity(domainEntity entity.Entity) Entity {
	return Entity{
		Id:           domainEntity.ID,
		Name:         domainEntity.Name,
		Type:         EntityType(domainEntity.Type),
		Description:  domainEntity.Description,
		ContactEmail: openapi_types.Email(domainEntity.ContactEmail),
		Website:      domainEntity.Website,
		Address:      domainToHTTPAddress(domainEntity.Address),
		CertifiedBy:  domainEntity.CertifiedBy,
	}
}

// domainToHTTPPublicEntity converts a domain entity to public HTTP entity (without contact email)
func domainToHTTPPublicEntity(domainEntity entity.Entity) PublicEntity {
	return PublicEntity{
		Id:          domainEntity.ID,
		Name:        domainEntity.Name,
		Type:        EntityType(domainEntity.Type),
		Description: domainEntity.Description,
		Website:     domainEntity.Website,
		Address:     domainToHTTPAddress(domainEntity.Address),
		CertifiedBy: domainEntity.CertifiedBy,
	}
}

// domainToHTTPAddress converts a domain address to HTTP address
func domainToHTTPAddress(domainAddress *entity.Address) *Address {
	if domainAddress == nil {
		return nil
	}
	return &Address{
		Street:     domainAddress.Street,
		City:       domainAddress.City,
		State:      domainAddress.State,
		PostalCode: domainAddress.PostalCode,
		Country:    domainAddress.Country,
	}
}

// httpToDomainAddress converts an HTTP address to domain address
func httpToDomainAddress(httpAddress *Address) *entity.Address {
	if httpAddress == nil {
		return nil
	}
	return &entity.Address{
		Street:     httpAddress.Street,
		City:       httpAddress.City,
		State:      httpAddress.State,
		PostalCode: httpAddress.PostalCode,
		Country:    httpAddress.Country,
	}
}

func (a apiServer) GetEntityMembers(ctx context.Context, request GetEntityMembersRequestObject) (GetEntityMembersResponseObject, error) {
	if err := a.authorizer.Authorize(ctx, ResourceEntities, ActionRead); err != nil {
		return GetEntityMembers403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	// For entity_managers, verify they can access members of this entity
	if err := a.authorizeEntityMemberAccess(ctx, request.EntityId, false); err != nil {
		return GetEntityMembers403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	// Get entity to verify it exists
	_, err := a.entityService.GetByID(ctx, request.EntityId)
	if err != nil {
		if errors.Is(err, documents.ErrDocumentNotFound) {
			return GetEntityMembers404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "Entity not found",
				},
			}, nil
		}
		return nil, err
	}

	members, err := a.entityService.GetMembers(ctx, request.EntityId)
	if err != nil {
		return nil, err
	}

	// Fetch user details from Kratos for each member
	httpMembers := make([]EntityMember, len(members))
	for i, m := range members {
		user, err := a.kratosClient.GetUser(ctx, m.UserID.String())
		if err != nil {
			// If we can't get user, just skip email and name
			httpMembers[i] = EntityMember{
				UserId:    m.UserID,
				UserName:  nil,
				UserEmail: nil,
				Role:      EntityMemberRole(m.Role),
			}
			continue
		}

		var userName *string
		var userEmail *openapi_types.Email

		if user.Name != nil {
			userName = user.Name
		}
		if user.Email != "" {
			emailVal := openapi_types.Email(user.Email)
			userEmail = &emailVal
		}

		httpMembers[i] = EntityMember{
			UserId:    m.UserID,
			UserName:  userName,
			UserEmail: userEmail,
			Role:      EntityMemberRole(m.Role),
		}
	}

	return GetEntityMembers200JSONResponse(httpMembers), nil
}

func (a apiServer) AddEntityMember(ctx context.Context, request AddEntityMemberRequestObject) (AddEntityMemberResponseObject, error) {
	if request.Body == nil {
		return AddEntityMember400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Request body is required",
			},
		}, nil
	}

	// Check authorization - user must have entities:update permission
	if err := a.authorizer.Authorize(ctx, ResourceEntities, ActionUpdate); err != nil {
		return AddEntityMember403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	// For entity_managers, verify they can manage members of this entity
	if err := a.authorizeEntityMemberAccess(ctx, request.EntityId, true); err != nil {
		return AddEntityMember403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	err := a.entityService.AddMemberWithInvite(ctx, entity.AddMemberWithInviteParams{
		EntityID: request.EntityId,
		Email:    string(request.Body.Email),
		Name:     request.Body.Name,
		Role:     string(request.Body.Role),
	})
	if err != nil {
		return nil, err
	}

	// Return a response indicating invitation was sent
	// Note: We don't have a user ID yet since the user hasn't claimed the invitation
	var userName *string
	var userEmail *openapi_types.Email

	if request.Body.Name != nil {
		userName = request.Body.Name
	}
	emailVal := openapi_types.Email(request.Body.Email)
	userEmail = &emailVal

	return AddEntityMember201JSONResponse{
		UserName:  userName,
		UserEmail: userEmail,
		Role:      EntityMemberRole(request.Body.Role),
	}, nil
}

func (a apiServer) RemoveEntityMember(ctx context.Context, request RemoveEntityMemberRequestObject) (RemoveEntityMemberResponseObject, error) {
	// Check authorization - user must have entities:update permission
	if err := a.authorizer.Authorize(ctx, ResourceEntities, ActionUpdate); err != nil {
		return RemoveEntityMember403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	// For entity_managers, verify they can manage members of this entity
	if err := a.authorizeEntityMemberAccess(ctx, request.EntityId, true); err != nil {
		return RemoveEntityMember403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	err := a.entityService.RemoveMember(ctx, request.EntityId, request.UserId)
	if err != nil {
		return nil, err
	}

	return RemoveEntityMember204Response{}, nil
}

func (a apiServer) UpdateEntityMemberRole(ctx context.Context, request UpdateEntityMemberRoleRequestObject) (UpdateEntityMemberRoleResponseObject, error) {
	if request.Body == nil {
		return UpdateEntityMemberRole400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Request body is required",
			},
		}, nil
	}

	// Check authorization - user must have entities:update permission
	if err := a.authorizer.Authorize(ctx, ResourceEntities, ActionUpdate); err != nil {
		return UpdateEntityMemberRole403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	// For entity_managers, verify they can manage members of this entity
	if err := a.authorizeEntityMemberAccess(ctx, request.EntityId, true); err != nil {
		return UpdateEntityMemberRole403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	err := a.entityService.UpdateMemberRole(ctx, request.EntityId, request.UserId, string(request.Body.Role))
	if err != nil {
		return nil, err
	}

	// Fetch user details from Kratos
	user, err := a.kratosClient.GetUser(ctx, request.UserId.String())
	if err != nil {
		return nil, err
	}

	var userName *string
	var userEmail *openapi_types.Email

	if user.Name != nil {
		userName = user.Name
	}
	if user.Email != "" {
		emailVal := openapi_types.Email(user.Email)
		userEmail = &emailVal
	}

	return UpdateEntityMemberRole200JSONResponse{
		UserId:    request.UserId,
		UserName:  userName,
		UserEmail: userEmail,
		Role:      EntityMemberRole(request.Body.Role),
	}, nil
}
