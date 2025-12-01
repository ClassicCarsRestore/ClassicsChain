package http

import (
	"context"
	"fmt"

	openapi_types "github.com/oapi-codegen/runtime/types"
	"github.com/s1moe2/classics-chain/auth"
)

// GetAdminUsers lists all admin users
func (a apiServer) GetAdminUsers(ctx context.Context, request GetAdminUsersRequestObject) (GetAdminUsersResponseObject, error) {
	// Check authorization - only admins can list admin users
	if err := a.authorizer.Authorize(ctx, ResourceAdminUsers, ActionRead); err != nil {
		return GetAdminUsers403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	limit := 20
	offset := 0
	if request.Params.Limit != nil {
		limit = *request.Params.Limit
	}
	if request.Params.Page != nil {
		offset = (*request.Params.Page - 1) * limit
	}

	adminUsers, total, err := a.userService.ListAdminUsers(ctx, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("list admin users: %w", err)
	}

	httpUsers := make([]AdminUser, len(adminUsers))
	for i, user := range adminUsers {
		httpUsers[i] = AdminUser{
			Id:    user.ID,
			Email: openapi_types.Email(user.Email),
			Name:  user.Name,
		}
	}

	totalPages := (total + limit - 1) / limit
	page := (offset / limit) + 1

	return GetAdminUsers200JSONResponse{
		Data: httpUsers,
		Meta: PaginationMeta{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	}, nil
}

// CreateAdminUser creates an invitation for a new admin user
func (a apiServer) CreateAdminUser(ctx context.Context, request CreateAdminUserRequestObject) (CreateAdminUserResponseObject, error) {
	// Check authorization - only admins can create admin users
	if err := a.authorizer.Authorize(ctx, ResourceAdminUsers, ActionCreate); err != nil {
		return CreateAdminUser403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	if request.Body == nil {
		return CreateAdminUser400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Request body is required",
			},
		}, nil
	}

	err := a.userService.CreateAdminInvitation(ctx, string(request.Body.Email), request.Body.Name)
	if err != nil {
		return nil, err
	}

	// Return a response indicating invitation was sent
	// Note: We don't have a user ID yet since the user hasn't claimed the invitation
	return CreateAdminUser201JSONResponse(AdminUser{
		Email: request.Body.Email,
		Name:  request.Body.Name,
	}), nil
}

// GetAdminUser retrieves a specific admin user by ID
func (a apiServer) GetAdminUser(ctx context.Context, request GetAdminUserRequestObject) (GetAdminUserResponseObject, error) {
	// Check authorization - only admins can view admin users
	if err := a.authorizer.Authorize(ctx, ResourceAdminUsers, ActionRead); err != nil {
		return GetAdminUser403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	adminUser, err := a.userService.GetAdminUserWithTraits(ctx, request.UserId)
	if err != nil {
		return GetAdminUser404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "User not found",
			},
		}, nil
	}

	httpUser := AdminUser{
		Id:    adminUser.ID,
		Email: openapi_types.Email(adminUser.Email),
		Name:  adminUser.Name,
	}
	return GetAdminUser200JSONResponse(httpUser), nil
}

// DeleteAdminUser removes admin privileges from a user
func (a apiServer) DeleteAdminUser(ctx context.Context, request DeleteAdminUserRequestObject) (DeleteAdminUserResponseObject, error) {
	// Check authorization - only admins can delete admin users
	if err := a.authorizer.Authorize(ctx, ResourceAdminUsers, ActionDelete); err != nil {
		return DeleteAdminUser403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	err := a.userService.RemoveAdminPrivileges(ctx, request.UserId)
	if err != nil {
		return DeleteAdminUser404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "User not found or is not an admin",
			},
		}, nil
	}

	return DeleteAdminUser204Response{}, nil
}

// GetMe returns the current user's entity memberships and pending invitations
func (a apiServer) GetMe(ctx context.Context, request GetMeRequestObject) (GetMeResponseObject, error) {
	userID, ok := auth.GetIdentityID(ctx)
	if !ok {
		return GetMe401JSONResponse{
			UnauthorizedJSONResponse: UnauthorizedJSONResponse{
				Error: "No user identity found",
			},
		}, nil
	}

	email, _ := auth.GetIdentityEmail(ctx)

	userProfile, err := a.userService.GetUserProfile(ctx, userID, email)
	if err != nil {
		return nil, fmt.Errorf("get user profile: %w", err)
	}

	entities := []UserEntityMembership{}
	for _, m := range userProfile.EntityMemberships {
		entityMembership := UserEntityMembership{
			EntityId: m.EntityID,
			Role:     UserEntityMembershipRole(m.Role),
		}

		if m.EntityName != nil {
			entityMembership.EntityName = *m.EntityName
		}
		if m.EntityType != nil {
			entityMembership.EntityType = (EntityType)(*m.EntityType)
		}

		entities = append(entities, entityMembership)
	}

	// TODO refactor
	// Convert pending invitation vehicles to HTTP format
	pendingInvitationsVehicles := []InvitationVehicle{}
	for _, v := range userProfile.PendingInvitationVehicles {
		// Safely extract vehicle data
		item := InvitationVehicle{}
		if vehicleMap, ok := v.(map[string]interface{}); ok {
			if id, ok := vehicleMap["id"].(openapi_types.UUID); ok {
				item.VehicleId = id
			}
			if make, ok := vehicleMap["make"].(string); ok && make != "" {
				item.Make = &make
			}
			if model, ok := vehicleMap["model"].(string); ok && model != "" {
				item.Model = &model
			}
			if year, ok := vehicleMap["year"].(int); ok && year != 0 {
				item.Year = &year
			}
			if licensePlate, ok := vehicleMap["licensePlate"].(*string); ok && licensePlate != nil && *licensePlate != "" {
				item.LicensePlate = licensePlate
			}
		}
		if item.VehicleId.String() != "" {
			pendingInvitationsVehicles = append(pendingInvitationsVehicles, item)
		}
	}

	profile := UserProfile{
		Entities: entities,
		Id:       userID,
	}
	profile.PendingInvitations.Count = len(pendingInvitationsVehicles)
	profile.PendingInvitations.Vehicles = pendingInvitationsVehicles

	return GetMe200JSONResponse(profile), nil
}
