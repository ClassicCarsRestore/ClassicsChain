package http

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/ClassicCarsRestore/ClassicsChain/auth"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/vehicles"
	"github.com/google/uuid"
)

var (
	ErrVehicleNotFound        = errors.New("vehicle not found")
	ErrAuthenticationRequired = errors.New("authentication required")
	ErrForbiddenVehicleAccess = errors.New("forbidden: cannot access vehicle")
)

// checkVehicleAccess verifies that the current user has permission to access a vehicle
// Returns the vehicle if access is allowed, otherwise returns an error
func (a apiServer) checkVehicleAccess(ctx context.Context, vehicleID uuid.UUID) (*vehicles.Vehicle, error) {
	vehicle, err := a.vehicleService.GetByID(ctx, vehicleID)
	if err != nil {
		if errors.Is(err, vehicles.ErrVehicleNotFound) {
			return nil, ErrVehicleNotFound
		}
		return nil, err
	}

	if auth.IsUser(ctx) {
		currentUserID, ok := auth.GetIdentityID(ctx)
		if !ok {
			return nil, ErrAuthenticationRequired
		}

		if *vehicle.OwnerID != currentUserID {
			return nil, ErrForbiddenVehicleAccess
		}
	}

	if auth.IsOAuth2Request(ctx) && !auth.HasScope(ctx, auth.ScopeVehiclesRead) {
		return nil, ErrForbiddenVehicleAccess
	}

	return vehicle, nil
}

func (a apiServer) GetVehicles(ctx context.Context, request GetVehiclesRequestObject) (GetVehiclesResponseObject, error) {
	if auth.IsOAuth2Request(ctx) && !auth.HasScope(ctx, auth.ScopeVehiclesRead) {
		return GetVehicles403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "insufficient_scope: vehicles:read required",
			},
		}, nil
	}

	var currentUserID uuid.UUID
	var ownerID *uuid.UUID

	if auth.IsUser(ctx) {
		uid, ok := auth.GetIdentityID(ctx)
		if !ok {
			return GetVehicles401JSONResponse{
				UnauthorizedJSONResponse: UnauthorizedJSONResponse{
					Error: "Authentication required",
				},
			}, nil
		}
		currentUserID = uid
		ownerID = &currentUserID
	}

	if request.Params.OwnerId != nil {
		// Non-admin users cannot view other users' vehicles
		if auth.IsUser(ctx) && *request.Params.OwnerId != currentUserID {
			return GetVehicles403JSONResponse{
				ForbiddenJSONResponse: ForbiddenJSONResponse{
					Error: "forbidden: cannot view other users' vehicles",
				},
			}, nil
		}

		ownerID = request.Params.OwnerId
	}

	limit := 20
	offset := 0
	if request.Params.Limit != nil {
		limit = *request.Params.Limit
	}
	if request.Params.Page != nil {
		offset = (*request.Params.Page - 1) * limit
	}

	vehicleList, total, err := a.vehicleService.GetAllWithStats(ctx, limit, offset, ownerID)
	if err != nil {
		return nil, err
	}

	httpVehicles := make([]Vehicle, len(vehicleList))
	for i, vehicle := range vehicleList {
		httpVehicles[i] = domainToHTTPVehicleWithStats(vehicle)
	}

	return GetVehicles200JSONResponse{
		Data: httpVehicles,
		Meta: PaginationMeta{
			Page:       (offset / limit) + 1,
			Limit:      limit,
			Total:      total,
			TotalPages: (total + limit - 1) / limit,
		},
	}, nil
}

func (a apiServer) CreateVehicle(ctx context.Context, request CreateVehicleRequestObject) (CreateVehicleResponseObject, error) {
	if err := a.authorizer.Authorize(ctx, ResourceVehicles, ActionCreate); err != nil {
		return nil, err
	}

	ownerID, ok := auth.GetIdentityID(ctx)
	if !ok {
		return nil, fmt.Errorf("unauthorized: must be logged in to create a vehicle")
	}

	params := vehicles.CreateVehicleParams{
		LicensePlate:       request.Body.LicensePlate,
		ChassisNumber:      request.Body.ChassisNumber,
		Make:               request.Body.Make,
		Model:              request.Body.Model,
		Year:               request.Body.Year,
		Color:              request.Body.Color,
		EngineNumber:       request.Body.EngineNumber,
		TransmissionNumber: request.Body.TransmissionNumber,
		BodyType:           request.Body.BodyType,
		DriveType:          request.Body.DriveType,
		GearType:           request.Body.GearType,
		SuspensionType:     request.Body.SuspensionType,
		Fuel:               request.Body.Fuel,
		EngineCc:           request.Body.EngineCc,
		EngineCylinders:    request.Body.EngineCylinders,
		EnginePowerHp:      request.Body.EnginePowerHp,
		OwnerID:            &ownerID,
	}

	createdVehicle, err := a.vehicleService.Create(ctx, params)
	if err != nil {
		if errors.Is(err, vehicles.ErrDuplicateChassisNo) {
			return CreateVehicle409JSONResponse{
				ConflictJSONResponse: ConflictJSONResponse{
					Error: ErrDuplicateChassisNoMsg,
					Code:  ErrDuplicateChassisNoCode,
				},
			}, nil
		}
		return nil, err
	}

	httpVehicle := domainToHTTPVehicle(*createdVehicle)
	return CreateVehicle201JSONResponse(httpVehicle), nil
}

func (a apiServer) GetVehicle(ctx context.Context, request GetVehicleRequestObject) (GetVehicleResponseObject, error) {
	vehicle, err := a.checkVehicleAccess(ctx, request.VehicleId)
	if err != nil {
		if errors.Is(err, ErrVehicleNotFound) {
			return GetVehicle404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: err.Error(),
				},
			}, nil
		}
		if errors.Is(err, ErrAuthenticationRequired) {
			return GetVehicle401JSONResponse{
				UnauthorizedJSONResponse: UnauthorizedJSONResponse{
					Error: err.Error(),
				},
			}, nil
		}
		if errors.Is(err, ErrForbiddenVehicleAccess) {
			return GetVehicle403JSONResponse{
				ForbiddenJSONResponse: ForbiddenJSONResponse{
					Error: err.Error(),
				},
			}, nil
		}

		return nil, err
	}

	httpVehicle := domainToHTTPVehicle(*vehicle)
	return GetVehicle200JSONResponse(httpVehicle), nil
}

func (a apiServer) UpdateVehicle(ctx context.Context, request UpdateVehicleRequestObject) (UpdateVehicleResponseObject, error) {
	if request.Body == nil {
		return nil, fmt.Errorf("request body is required")
	}

	if auth.IsOAuth2Request(ctx) && !auth.HasScope(ctx, auth.ScopeVehiclesWrite) {
		return UpdateVehicle403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "insufficient_scope: vehicles:write required",
			},
		}, nil
	}

	// Get existing vehicle to verify ownership
	existingVehicle, err := a.vehicleService.GetByID(ctx, request.VehicleId)
	if err != nil {
		return nil, err
	}
	if existingVehicle == nil {
		return nil, fmt.Errorf("vehicle not found")
	}

	// Check authorization and ownership
	// Only check ownership if vehicle has an owner
	if existingVehicle.OwnerID != nil {
		if err := a.authorizer.AuthorizeOwnership(ctx, ResourceVehicles, ActionUpdate, *existingVehicle.OwnerID); err != nil {
			return nil, err
		}
	} else if !auth.IsAdmin(ctx) {
		return nil, fmt.Errorf("forbidden: cannot update unclaimed vehicle")
	}

	params := vehicles.UpdateVehicleParams{
		LicensePlate:       request.Body.LicensePlate,
		ChassisNumber:      request.Body.ChassisNumber,
		Color:              request.Body.Color,
		EngineNumber:       request.Body.EngineNumber,
		TransmissionNumber: request.Body.TransmissionNumber,
		BodyType:           request.Body.BodyType,
		DriveType:          request.Body.DriveType,
		GearType:           request.Body.GearType,
		SuspensionType:     request.Body.SuspensionType,
		Fuel:               request.Body.Fuel,
		EngineCc:           request.Body.EngineCc,
		EngineCylinders:    request.Body.EngineCylinders,
		EnginePowerHp:      request.Body.EnginePowerHp,
		OwnerID:            request.Body.OwnerId,
	}

	updatedVehicle, err := a.vehicleService.Update(ctx, request.VehicleId, params)
	if err != nil {
		return nil, err
	}

	httpVehicle := domainToHTTPVehicle(*updatedVehicle)
	return UpdateVehicle200JSONResponse(httpVehicle), nil
}

func (a apiServer) CreateCertifierVehicle(ctx context.Context, request CreateCertifierVehicleRequestObject) (CreateCertifierVehicleResponseObject, error) {
	if auth.IsOAuth2Request(ctx) && !auth.HasScope(ctx, auth.ScopeVehiclesWrite) {
		return CreateCertifierVehicle403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "insufficient_scope: vehicles:write required",
			},
		}, nil
	}

	if err := a.authorizer.Authorize(ctx, ResourceVehicles, ActionCreate); err != nil {
		return CreateCertifierVehicle403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden: only entity members can create vehicles for certification",
			},
		}, nil
	}

	var ownerID *uuid.UUID
	var shouldSendInvitation bool
	var ownerEmail string

	if request.Body.OwnerEmail != nil {
		ownerEmail = string(*request.Body.OwnerEmail)
		userID, err := a.userService.GetUserByEmail(ctx, ownerEmail)
		if err != nil {
			return nil, fmt.Errorf("lookup user by email: %w", err)
		}
		if userID != nil {
			ownerID = userID
		} else {
			shouldSendInvitation = true
		}
	}

	params := vehicles.CreateVehicleParams{
		ShouldAnchor:       true,
		LicensePlate:       request.Body.LicensePlate,
		ChassisNumber:      request.Body.ChassisNumber,
		Make:               request.Body.Make,
		Model:              request.Body.Model,
		Year:               request.Body.Year,
		Color:              request.Body.Color,
		EngineNumber:       request.Body.EngineNumber,
		TransmissionNumber: request.Body.TransmissionNumber,
		BodyType:           request.Body.BodyType,
		DriveType:          request.Body.DriveType,
		GearType:           request.Body.GearType,
		SuspensionType:     request.Body.SuspensionType,
		Fuel:               request.Body.Fuel,
		EngineCc:           request.Body.EngineCc,
		EngineCylinders:    request.Body.EngineCylinders,
		EnginePowerHp:      request.Body.EnginePowerHp,
		OwnerID:            ownerID,
	}

	createdVehicle, err := a.vehicleService.Create(ctx, params)
	if err != nil {
		if errors.Is(err, vehicles.ErrDuplicateChassisNo) {
			return CreateCertifierVehicle409JSONResponse{
				ConflictJSONResponse: ConflictJSONResponse{
					Error: ErrDuplicateChassisNoMsg,
					Code:  ErrDuplicateChassisNoCode,
				},
			}, nil
		}
		return nil, err
	}

	if shouldSendInvitation {
		vehicleData := []map[string]interface{}{
			{
				"make":         createdVehicle.Make,
				"model":        createdVehicle.Model,
				"year":         createdVehicle.Year,
				"licensePlate": createdVehicle.LicensePlate,
			},
		}
		if err := a.invitationService.SendInvitationBatch(ctx, ownerEmail, []uuid.UUID{createdVehicle.ID}, vehicleData); err != nil {
			return nil, fmt.Errorf("send owner invitation: %w", err)
		}
	}

	httpVehicle := domainToHTTPVehicle(*createdVehicle)
	return CreateCertifierVehicle201JSONResponse(httpVehicle), nil
}

func (a apiServer) UpdateCertifierVehicle(ctx context.Context, request UpdateCertifierVehicleRequestObject) (UpdateCertifierVehicleResponseObject, error) {
	if request.Body == nil {
		return nil, fmt.Errorf("request body is required")
	}

	if auth.IsOAuth2Request(ctx) && !auth.HasScope(ctx, auth.ScopeVehiclesWrite) {
		return UpdateCertifierVehicle403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "insufficient_scope: vehicles:write required",
			},
		}, nil
	}

	if err := a.authorizer.Authorize(ctx, ResourceVehicles, ActionUpdate); err != nil {
		return UpdateCertifierVehicle403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden: only entity members can update vehicles for certification",
			},
		}, nil
	}

	existingVehicle, err := a.vehicleService.GetByID(ctx, request.VehicleId)
	if err != nil {
		if errors.Is(err, vehicles.ErrVehicleNotFound) {
			return UpdateCertifierVehicle404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "vehicle not found",
				},
			}, nil
		}
		return nil, err
	}

	if existingVehicle.OwnerID != nil && request.Body.OwnerEmail != nil {
		return UpdateCertifierVehicle400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "cannot assign owner email to a vehicle that already has an owner",
			},
		}, nil
	}

	var ownerID *uuid.UUID
	var shouldSendInvitation bool
	var ownerEmail string

	if request.Body.OwnerEmail != nil && existingVehicle.OwnerID == nil {
		pendingInvitation, err := a.invitationService.GetPendingInvitationForVehicle(ctx, request.VehicleId)
		if err != nil {
			return nil, fmt.Errorf("check pending invitation: %w", err)
		}
		if pendingInvitation != nil {
			return UpdateCertifierVehicle400JSONResponse{
				BadRequestJSONResponse: BadRequestJSONResponse{
					Error: "cannot send new invitation: a pending invitation already exists for this vehicle",
				},
			}, nil
		}

		ownerEmail = string(*request.Body.OwnerEmail)
		userID, err := a.userService.GetUserByEmail(ctx, ownerEmail)
		if err != nil {
			return nil, fmt.Errorf("lookup user by email: %w", err)
		}
		if userID != nil {
			ownerID = userID
		} else {
			shouldSendInvitation = true
		}
	}

	params := vehicles.UpdateVehicleParams{
		LicensePlate:       request.Body.LicensePlate,
		ChassisNumber:      request.Body.ChassisNumber,
		Color:              request.Body.Color,
		EngineNumber:       request.Body.EngineNumber,
		TransmissionNumber: request.Body.TransmissionNumber,
		BodyType:           request.Body.BodyType,
		DriveType:          request.Body.DriveType,
		GearType:           request.Body.GearType,
		SuspensionType:     request.Body.SuspensionType,
		Fuel:               request.Body.Fuel,
		EngineCc:           request.Body.EngineCc,
		EngineCylinders:    request.Body.EngineCylinders,
		EnginePowerHp:      request.Body.EnginePowerHp,
		OwnerID:            ownerID,
	}

	updatedVehicle, err := a.vehicleService.Update(ctx, request.VehicleId, params)
	if err != nil {
		return nil, err
	}

	if shouldSendInvitation {
		licensePlate := ""
		if updatedVehicle.LicensePlate != nil {
			licensePlate = *updatedVehicle.LicensePlate
		}
		vehicleData := []map[string]interface{}{
			{
				"make":         updatedVehicle.Make,
				"model":        updatedVehicle.Model,
				"year":         updatedVehicle.Year,
				"licensePlate": licensePlate,
			},
		}
		if err := a.invitationService.SendInvitationBatch(ctx, ownerEmail, []uuid.UUID{updatedVehicle.ID}, vehicleData); err != nil {
			return nil, fmt.Errorf("send owner invitation: %w", err)
		}
	}

	httpVehicle := domainToHTTPVehicle(*updatedVehicle)
	return UpdateCertifierVehicle200JSONResponse(httpVehicle), nil
}

func (a apiServer) GetCertifierVehicleInvitation(ctx context.Context, request GetCertifierVehicleInvitationRequestObject) (GetCertifierVehicleInvitationResponseObject, error) {
	if err := a.authorizer.Authorize(ctx, ResourceVehicles, ActionRead); err != nil {
		return GetCertifierVehicleInvitation403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden: only entity members can view vehicle invitations",
			},
		}, nil
	}

	_, err := a.vehicleService.GetByID(ctx, request.VehicleId)
	if err != nil {
		if errors.Is(err, vehicles.ErrVehicleNotFound) {
			return GetCertifierVehicleInvitation404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "vehicle not found",
				},
			}, nil
		}
		return nil, err
	}

	invitation, err := a.invitationService.GetPendingInvitationForVehicle(ctx, request.VehicleId)
	if err != nil {
		return nil, fmt.Errorf("get pending invitation: %w", err)
	}

	if invitation == nil {
		return GetCertifierVehicleInvitation200JSONResponse{
			HasPendingInvitation: false,
		}, nil
	}

	var expiresAt *time.Time
	if invitation.TokenExpiresAt != nil {
		expiresAt = invitation.TokenExpiresAt
	}

	return GetCertifierVehicleInvitation200JSONResponse{
		HasPendingInvitation: true,
		Email:                &invitation.Email,
		InvitedAt:            &invitation.InvitedAt,
		ExpiresAt:            expiresAt,
	}, nil
}

// domainToHTTPVehicle converts a domain vehicle to HTTP vehicle
func domainToHTTPVehicle(domainVehicle vehicles.Vehicle) Vehicle {
	return Vehicle{
		BlockchainAssetId:  domainVehicle.BlockchainAssetID,
		BodyType:           domainVehicle.BodyType,
		ChassisNumber:      domainVehicle.ChassisNumber,
		Cid:                domainVehicle.CID,
		CidSourceCBOR:      domainVehicle.CIDSourceCBOR,
		CidSourceJSON:      domainVehicle.CIDSourceJSON,
		Color:              domainVehicle.Color,
		CreatedAt:          time.Time{},
		DriveType:          domainVehicle.DriveType,
		EngineNumber:       domainVehicle.EngineNumber,
		GearType:           domainVehicle.GearType,
		Id:                 domainVehicle.ID,
		LicensePlate:       domainVehicle.LicensePlate,
		Make:               domainVehicle.Make,
		Model:              domainVehicle.Model,
		OwnerId:            domainVehicle.OwnerID,
		SuspensionType:     domainVehicle.SuspensionType,
		TransmissionNumber: domainVehicle.TransmissionNumber,
		Year:               domainVehicle.Year,
		Fuel:               domainVehicle.Fuel,
		EngineCc:           domainVehicle.EngineCc,
		EngineCylinders:    domainVehicle.EngineCylinders,
		EnginePowerHp:      domainVehicle.EnginePowerHp,
	}
}

// domainToHTTPVehicleWithStats converts a domain vehicle with stats to HTTP vehicle
func domainToHTTPVehicleWithStats(domainVehicle vehicles.VehicleWithStats) Vehicle {
	certifiedEventsCount := domainVehicle.CertifiedEventsCount
	ownerEventsCount := domainVehicle.OwnerEventsCount
	activeCertificationsCount := domainVehicle.ActiveCertificationsCount

	return Vehicle{
		BlockchainAssetId:         domainVehicle.BlockchainAssetID,
		BodyType:                  domainVehicle.BodyType,
		ChassisNumber:             domainVehicle.ChassisNumber,
		Cid:                       domainVehicle.CID,
		CidSourceCBOR:             domainVehicle.CIDSourceCBOR,
		CidSourceJSON:             domainVehicle.CIDSourceJSON,
		Color:                     domainVehicle.Color,
		CreatedAt:                 time.Time{},
		DriveType:                 domainVehicle.DriveType,
		EngineNumber:              domainVehicle.EngineNumber,
		GearType:                  domainVehicle.GearType,
		Id:                        domainVehicle.ID,
		LicensePlate:              domainVehicle.LicensePlate,
		Make:                      domainVehicle.Make,
		Model:                     domainVehicle.Model,
		OwnerId:                   domainVehicle.OwnerID,
		SuspensionType:            domainVehicle.SuspensionType,
		TransmissionNumber:        domainVehicle.TransmissionNumber,
		Year:                      domainVehicle.Year,
		Fuel:                      domainVehicle.Fuel,
		EngineCc:                  domainVehicle.EngineCc,
		EngineCylinders:           domainVehicle.EngineCylinders,
		EnginePowerHp:             domainVehicle.EnginePowerHp,
		CertifiedEventsCount:      &certifiedEventsCount,
		OwnerEventsCount:          &ownerEventsCount,
		ActiveCertificationsCount: &activeCertificationsCount,
	}
}
