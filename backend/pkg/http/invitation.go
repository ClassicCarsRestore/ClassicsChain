package http

import (
	"context"
	"errors"

	openapi_types "github.com/oapi-codegen/runtime/types"
	"github.com/s1moe2/classics-chain/auth"
	"github.com/s1moe2/classics-chain/invitation"
)

func (a apiServer) ValidateInvitation(ctx context.Context, request ValidateInvitationRequestObject) (ValidateInvitationResponseObject, error) {
	if request.Params.Token == "" {
		return ValidateInvitation400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "token parameter is required",
			},
		}, nil
	}

	// Get all invitations for this token (all vehicles for this email)
	invitations, email, err := a.invitationService.GetInvitationsByToken(ctx, request.Params.Token)
	if err != nil {
		if errors.Is(err, invitation.ErrInvitationNotFound) {
			return ValidateInvitation404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "Invalid or expired invitation token",
				},
			}, nil
		}
		return nil, err
	}

	// Get vehicle details for each invitation, filtering duplicates
	// Use a map to track unique vehicles by ID
	vehiclesMap := make(map[openapi_types.UUID]InvitationVehicle)

	for _, inv := range invitations {
		if _, exists := vehiclesMap[inv.VehicleID]; exists {
			continue
		}

		vehicle, err := a.vehicleService.GetByID(ctx, inv.VehicleID)
		if err != nil {
			continue
		}

		item := InvitationVehicle{
			VehicleId: vehicle.ID,
		}

		if vehicle.Make != "" {
			item.Make = &vehicle.Make
		}
		if vehicle.Model != "" {
			item.Model = &vehicle.Model
		}
		if vehicle.Year != 0 {
			item.Year = &vehicle.Year
		}
		if vehicle.LicensePlate != nil && *vehicle.LicensePlate != "" {
			item.LicensePlate = vehicle.LicensePlate
		}

		vehiclesMap[vehicle.ID] = item
	}

	vehiclesList := make([]InvitationVehicle, 0, len(vehiclesMap))
	for _, item := range vehiclesMap {
		vehiclesList = append(vehiclesList, item)
	}

	return ValidateInvitation200JSONResponse{
		Email:    openapi_types.Email(email),
		Vehicles: vehiclesList,
	}, nil
}

func (a apiServer) ClaimInvitations(ctx context.Context, _ ClaimInvitationsRequestObject) (ClaimInvitationsResponseObject, error) {
	identityID, ok := auth.GetIdentityID(ctx)
	if !ok {
		return ClaimInvitations401JSONResponse{
			UnauthorizedJSONResponse: UnauthorizedJSONResponse{
				Code:  "unauthorized",
				Error: "Authentication required",
			},
		}, nil
	}

	email, ok := auth.GetIdentityEmail(ctx)
	if !ok || email == "" {
		return ClaimInvitations401JSONResponse{
			UnauthorizedJSONResponse: UnauthorizedJSONResponse{
				Code:  "unauthorized",
				Error: "Email not found in identity",
			},
		}, nil
	}

	pendingInvitations, err := a.invitationService.GetPendingInvitationsForEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	if err := a.invitationService.ClaimInvitations(ctx, email, identityID); err != nil {
		return nil, err
	}

	// Build response with claimed vehicles
	vehiclesMap := make(map[openapi_types.UUID]InvitationVehicle)

	for _, inv := range pendingInvitations {
		if _, exists := vehiclesMap[inv.VehicleID]; exists {
			continue
		}

		vehicle, err := a.vehicleService.GetByID(ctx, inv.VehicleID)
		if err != nil {
			continue
		}

		item := InvitationVehicle{
			VehicleId: vehicle.ID,
		}

		if vehicle.Make != "" {
			item.Make = &vehicle.Make
		}
		if vehicle.Model != "" {
			item.Model = &vehicle.Model
		}
		if vehicle.Year != 0 {
			item.Year = &vehicle.Year
		}
		if vehicle.LicensePlate != nil && *vehicle.LicensePlate != "" {
			item.LicensePlate = vehicle.LicensePlate
		}

		vehiclesMap[vehicle.ID] = item
	}

	claimedVehicles := make([]InvitationVehicle, 0, len(vehiclesMap))
	for _, item := range vehiclesMap {
		claimedVehicles = append(claimedVehicles, item)
	}

	return ClaimInvitations200JSONResponse{
		ClaimedVehicles: claimedVehicles,
		Count:           len(claimedVehicles),
	}, nil
}
