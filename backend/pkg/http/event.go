package http

import (
	"context"
	"errors"
	"fmt"
	"time"

	openapi_types "github.com/oapi-codegen/runtime/types"
	"github.com/s1moe2/classics-chain/auth"
	"github.com/s1moe2/classics-chain/event"
)

func (a apiServer) GetVehicleEvents(ctx context.Context, request GetVehicleEventsRequestObject) (GetVehicleEventsResponseObject, error) {
	_, err := a.checkVehicleAccess(ctx, request.VehicleId)
	if err != nil {
		if errors.Is(err, ErrVehicleNotFound) {
			return GetVehicleEvents404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: err.Error(),
				},
			}, nil
		}
		if errors.Is(err, ErrAuthenticationRequired) {
			return GetVehicleEvents401JSONResponse{
				UnauthorizedJSONResponse: UnauthorizedJSONResponse{
					Error: err.Error(),
				},
			}, nil
		}
		if errors.Is(err, ErrForbiddenVehicleAccess) {
			return GetVehicleEvents403JSONResponse{
				ForbiddenJSONResponse: ForbiddenJSONResponse{
					Error: err.Error(),
				},
			}, nil
		}
		return nil, err
	}

	limit := 20
	offset := 0
	if request.Params.Limit != nil {
		limit = *request.Params.Limit
	}
	if request.Params.Page != nil {
		offset = (*request.Params.Page - 1) * limit
	}

	events, total, err := a.eventService.GetByVehicle(ctx, request.VehicleId, limit, offset)
	if err != nil {
		return nil, err
	}

	httpEvents := make([]Event, len(events))
	for i, evt := range events {
		httpEvents[i] = domainToHTTPEvent(evt)
	}

	totalPages := (total + limit - 1) / limit
	page := (offset / limit) + 1

	return GetVehicleEvents200JSONResponse{
		Data: httpEvents,
		Meta: PaginationMeta{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	}, nil
}

func (a apiServer) CreateEvent(ctx context.Context, request CreateEventRequestObject) (CreateEventResponseObject, error) {
	if request.Body == nil {
		return CreateEvent400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Request body is required",
			},
		}, nil
	}

	if err := a.authorizer.Authorize(ctx, ResourceEvents, ActionCreate); err != nil {
		return CreateEvent403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	vehicle, err := a.vehicleService.GetByID(ctx, request.Body.VehicleId)
	if err != nil {
		return nil, err
	}
	if vehicle == nil {
		return CreateEvent404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "vehicle not found",
			},
		}, nil
	}

	params := event.CreateEventParams{
		VehicleID:    request.Body.VehicleId,
		EntityID:     request.Body.EntityId,
		Type:         event.EventType(request.Body.Type),
		Title:        request.Body.Title,
		Description:  request.Body.Description,
		Date:         request.Body.Date,
		Location:     request.Body.Location,
		Metadata:     getMetadataValue(request.Body.Metadata),
		ShouldAnchor: true,
	}

	createdEvent, err := a.eventService.Create(ctx, *vehicle, params)
	if err != nil {
		return nil, err
	}

	httpEvent := domainToHTTPEvent(*createdEvent)
	return CreateEvent201JSONResponse(httpEvent), nil
}

func (a apiServer) CreateOwnerEvent(ctx context.Context, request CreateOwnerEventRequestObject) (CreateOwnerEventResponseObject, error) {
	if request.Body == nil {
		return CreateOwnerEvent400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Request body is required",
			},
		}, nil
	}

	if err := a.authorizer.Authorize(ctx, ResourceOwnerEvents, ActionCreate); err != nil {
		return CreateOwnerEvent403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	vehicle, err := a.vehicleService.GetByID(ctx, request.VehicleId)
	if err != nil {
		return nil, err
	}
	if vehicle == nil || vehicle.OwnerID == nil {
		return CreateOwnerEvent404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "vehicle not found",
			},
		}, nil
	}

	userID, ok := auth.GetIdentityID(ctx)
	if !ok {
		return CreateOwnerEvent403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	if *vehicle.OwnerID != userID {
		return CreateOwnerEvent403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	params := event.CreateEventParams{
		VehicleID:   request.VehicleId,
		Type:        event.EventType(request.Body.Type),
		Title:       request.Body.Title,
		Description: request.Body.Description,
		Location:    request.Body.Location,
	}

	if request.Body.Date != nil {
		params.Date = &request.Body.Date.Time
	}

	createdEvent, err := a.eventService.Create(ctx, *vehicle, params)
	if err != nil {
		return nil, err
	}

	httpEvent := domainToHTTPEvent(*createdEvent)
	return CreateOwnerEvent201JSONResponse(httpEvent), nil
}

func (a apiServer) GetEvent(ctx context.Context, request GetEventRequestObject) (GetEventResponseObject, error) {
	evt, err := a.eventService.GetByID(ctx, request.EventId)
	if err != nil {
		if errors.Is(err, event.ErrEventNotFound) {
			return GetEvent404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "Event not found",
				},
			}, nil
		}
		return nil, err
	}

	httpEvent := domainToHTTPEvent(*evt)
	return GetEvent200JSONResponse(httpEvent), nil
}

func (a apiServer) CreateBulkEvents(ctx context.Context, request CreateBulkEventsRequestObject) (CreateBulkEventsResponseObject, error) {
	if request.Body == nil {
		return nil, fmt.Errorf("request body is required")
	}

	if err := a.authorizer.Authorize(ctx, ResourceEvents, ActionCreate); err != nil {
		return nil, err
	}

	if len(request.Body.Vehicles) == 0 {
		return CreateBulkEvents400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "vehicles array cannot be empty",
			},
		}, nil
	}

	// Convert HTTP request to service parameters
	vehicles := make([]event.BulkEventVehicle, len(request.Body.Vehicles))
	for i, v := range request.Body.Vehicles {
		// Convert Email from openapi_types.Email to *string
		var email *string
		if v.Email != nil {
			emailStr := string(*v.Email)
			email = &emailStr
		}

		vehicles[i] = event.BulkEventVehicle{
			ChassisNumber: v.ChassisNumber,
			LicensePlate:  v.LicensePlate,
			Email:         email,
		}
	}

	var date *time.Time
	if request.Body.Date != nil {
		date = &request.Body.Date.Time
	}

	var metadata map[string]interface{}
	if request.Body.Metadata != nil {
		metadata = *request.Body.Metadata
	}

	params := event.CreateBulkEventsParams{
		Vehicles:    vehicles,
		EntityID:    request.Body.EntityId,
		Title:       request.Body.Title,
		Description: request.Body.Description,
		Type:        event.EventType(request.Body.Type),
		Location:    request.Body.Location,
		Date:        date,
		Metadata:    metadata,
	}

	result, err := a.eventService.CreateBulkEvents(ctx, params)
	if err != nil {
		return nil, err
	}

	successList := make([]BulkEventSuccess, len(result.Success))
	for i, s := range result.Success {
		successList[i] = BulkEventSuccess{
			VehicleId:      s.VehicleID,
			EventId:        s.EventID,
			Created:        s.Created,
			InvitationSent: s.InvitationSent,
		}
	}

	errorList := make([]BulkEventError, len(result.Errors))
	for i, e := range result.Errors {
		errorList[i] = BulkEventError{
			ChassisNumber: &e.ChassisNumber,
			LicensePlate:  &e.LicensePlate,
			Error:         e.Error,
		}
	}

	return CreateBulkEvents201JSONResponse{
		Success: successList,
		Errors:  errorList,
	}, nil
}

func domainToHTTPEvent(domainEvent event.Event) Event {
	return Event{
		BlockchainTxId: domainEvent.BlockchainTxID,
		Cid:            domainEvent.CID,
		CidSourceCBOR:  domainEvent.CIDSourceCBOR,
		CidSourceJSON:  domainEvent.CIDSourceJSON,
		CreatedAt:      domainEvent.CreatedAt,
		Date:           openapi_types.Date{Time: domainEvent.Date},
		Description:    domainEvent.Description,
		EntityId:       domainEvent.EntityID,
		Id:             domainEvent.ID,
		Location:       domainEvent.Location,
		Metadata:       &domainEvent.Metadata,
		Title:          domainEvent.Title,
		Type:           EventType(domainEvent.Type),
		VehicleId:      domainEvent.VehicleID,
	}
}

func getMetadataValue(metadata *map[string]interface{}) map[string]interface{} {
	if metadata == nil {
		return nil
	}
	return *metadata
}
