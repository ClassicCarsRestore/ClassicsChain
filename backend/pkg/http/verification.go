package http

import (
	"context"

	openapi_types "github.com/oapi-codegen/runtime/types"
	"github.com/s1moe2/classics-chain/pkg/postgres/db"
)

func (a apiServer) GetVehicleVerification(ctx context.Context, request GetVehicleVerificationRequestObject) (GetVehicleVerificationResponseObject, error) {
	vehicle, err := a.querier.GetVehicleForVerification(ctx, request.VehicleId)
	if err != nil {
		return GetVehicleVerification404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Vehicle not found",
				Code:  "not_found",
			},
		}, nil
	}

	events, err := a.querier.ListEventsForVerification(ctx, vehicle.ID)
	if err != nil {
		return nil, err
	}

	return GetVehicleVerification200JSONResponse(buildVerificationResponse(vehicle, events, a.algorandNetwork)), nil
}

func (a apiServer) LookupVehicleVerification(ctx context.Context, request LookupVehicleVerificationRequestObject) (LookupVehicleVerificationResponseObject, error) {
	if request.Params.ChassisNumber == "" {
		return LookupVehicleVerification400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Chassis number is required",
				Code:  "bad_request",
			},
		}, nil
	}

	vehicle, err := a.querier.GetVehicleForVerificationByChassisNumber(ctx, request.Params.ChassisNumber)
	if err != nil {
		return LookupVehicleVerification404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Vehicle not found",
				Code:  "not_found",
			},
		}, nil
	}

	events, err := a.querier.ListEventsForVerification(ctx, vehicle.ID)
	if err != nil {
		return nil, err
	}

	resp := buildVerificationResponse(db.GetVehicleForVerificationRow(vehicle), events, a.algorandNetwork)
	return LookupVehicleVerification200JSONResponse(resp), nil
}

func buildVerificationResponse(vehicle db.GetVehicleForVerificationRow, events []db.ListEventsForVerificationRow, algorandNetwork string) VehicleVerificationResponse {
	isAnchored := vehicle.BlockchainAssetID != ""

	var blockchainAssetID *string
	if vehicle.BlockchainAssetID != "" {
		blockchainAssetID = &vehicle.BlockchainAssetID
	}

	verificationEvents := make([]VerificationEvent, len(events))
	for i, e := range events {
		eventAnchored := e.BlockchainTxID != ""
		ve := VerificationEvent{
			Id:         openapi_types.UUID(e.ID),
			Type:       e.EventType,
			Title:      e.Title,
			Date:       openapi_types.Date{Time: e.EventDate},
			IsAnchored: eventAnchored,
			EntityName: e.EntityName,
			Cid:        e.Cid,
		}
		if eventAnchored {
			ve.BlockchainTxId = &e.BlockchainTxID
		}
		verificationEvents[i] = ve
	}

	return VehicleVerificationResponse{
		VehicleId:         openapi_types.UUID(vehicle.ID),
		Make:              vehicle.Make,
		Model:             vehicle.Model,
		Year:              int(vehicle.Year),
		IsAnchored:        isAnchored,
		BlockchainAssetId: blockchainAssetID,
		VehicleCid:        vehicle.Cid,
		AlgorandNetwork:   algorandNetwork,
		TotalEvents:       int(vehicle.TotalEvents),
		AnchoredEvents:    int(vehicle.AnchoredEvents),
		CertifiedEvents:   int(vehicle.CertifiedEvents),
		Events:            verificationEvents,
	}
}
