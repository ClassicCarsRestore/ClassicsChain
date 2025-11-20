package http

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/s1moe2/classics-chain/auth"
	"github.com/s1moe2/classics-chain/vehicles"
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

	vehicleList, total, err := a.vehicleService.GetAll(ctx, limit, offset, ownerID)
	if err != nil {
		return nil, err
	}

	httpVehicles := make([]Vehicle, len(vehicleList))
	for i, vehicle := range vehicleList {
		httpVehicles[i] = domainToHTTPVehicle(vehicle)
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
		return nil, fmt.Errorf("forbidden: cannot update orphaned vehicle")
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
		OwnerID:            nil,
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

	httpVehicle := domainToHTTPVehicle(*createdVehicle)
	return CreateCertifierVehicle201JSONResponse(httpVehicle), nil
}

func (a apiServer) ClaimVehicle(ctx context.Context, request ClaimVehicleRequestObject) (ClaimVehicleResponseObject, error) {
	vehicle, err := a.vehicleService.GetByID(ctx, request.VehicleId)
	if err != nil {
		return nil, err
	}

	if vehicle == nil {
		return ClaimVehicle404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "vehicle not found",
			},
		}, nil
	}

	// Vehicle must be orphaned to claim
	if vehicle.OwnerID != nil {
		return ClaimVehicle403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden: vehicle already has an owner",
			},
		}, nil
	}

	// Verify match criteria (at least one identifier must match)
	var matchFound bool
	if request.Body.ChassisNumber != nil && vehicle.ChassisNumber != nil && *request.Body.ChassisNumber == *vehicle.ChassisNumber {
		matchFound = true
	}
	if request.Body.LicensePlate != nil && vehicle.LicensePlate != nil && *request.Body.LicensePlate == *vehicle.LicensePlate {
		matchFound = true
	}

	if !matchFound {
		return ClaimVehicle400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "provided identifiers do not match the vehicle",
			},
		}, nil
	}

	userID, ok := auth.GetIdentityID(ctx)
	if !ok {
		return nil, fmt.Errorf("unauthorized: must be logged in to claim vehicle")
	}

	claimedVehicle, err := a.vehicleService.ClaimVehicleOwnership(ctx, userID, request.VehicleId)
	if err != nil {
		return nil, err
	}

	if claimedVehicle == nil {
		return ClaimVehicle404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "vehicle not found or already claimed",
			},
		}, nil
	}

	httpVehicle := domainToHTTPVehicle(*claimedVehicle)
	return ClaimVehicle200JSONResponse(httpVehicle), nil
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
	}
}
