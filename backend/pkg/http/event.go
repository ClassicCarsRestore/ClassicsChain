package http

import (
	"context"
	"errors"

	"github.com/ClassicCarsRestore/ClassicsChain/auth"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/event"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/event_images"
	openapi_types "github.com/oapi-codegen/runtime/types"
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
		images, _ := a.eventImageService.ListByEvent(ctx, evt.ID)
		httpEvents[i] = domainToHTTPEvent(evt, images)
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
		VehicleID:      request.Body.VehicleId,
		EntityID:       request.Body.EntityId,
		Type:           event.EventType(request.Body.Type),
		Title:          request.Body.Title,
		Description:    request.Body.Description,
		Date:           request.Body.Date,
		Location:       request.Body.Location,
		Metadata:       getMetadataValue(request.Body.Metadata),
		ShouldAnchor:   true,
		ImageSessionID: request.Body.ImageSessionId,
	}

	createdEvent, err := a.eventService.Create(ctx, *vehicle, params)
	if err != nil {
		return nil, err
	}

	images, _ := a.eventImageService.ListByEvent(ctx, createdEvent.ID)
	httpEvent := domainToHTTPEvent(*createdEvent, images)
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
		VehicleID:      request.VehicleId,
		Type:           event.EventType(request.Body.Type),
		Title:          request.Body.Title,
		Description:    request.Body.Description,
		Location:       request.Body.Location,
		ImageSessionID: request.Body.ImageSessionId,
	}

	if request.Body.Date != nil {
		params.Date = &request.Body.Date.Time
	}

	createdEvent, err := a.eventService.Create(ctx, *vehicle, params)
	if err != nil {
		return nil, err
	}

	images, _ := a.eventImageService.ListByEvent(ctx, createdEvent.ID)
	httpEvent := domainToHTTPEvent(*createdEvent, images)
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

	images, _ := a.eventImageService.ListByEvent(ctx, evt.ID)
	httpEvent := domainToHTTPEvent(*evt, images)
	return GetEvent200JSONResponse(httpEvent), nil
}

func domainToHTTPEvent(domainEvent event.Event, images []event_images.EventImage) Event {
	var httpImages *[]EventImage
	if len(images) > 0 {
		imgs := make([]EventImage, len(images))
		for i, img := range images {
			imgs[i] = EventImage{
				Id:              img.ID,
				EventId:         img.EventID,
				UploadSessionId: img.UploadSessionID,
				ObjectKey:       img.ObjectKey,
				Cid:             img.CID,
				CreatedAt:       img.CreatedAt,
			}
		}
		httpImages = &imgs
	}

	blockchainStatus := EventBlockchainStatus(domainEvent.BlockchainStatus)
	return Event{
		BlockchainTxId:      domainEvent.BlockchainTxID,
		BlockchainStatus:    &blockchainStatus,
		Cid:                 domainEvent.CID,
		CidSourceCBOR:       domainEvent.CIDSourceCBOR,
		CidSourceJSON:       domainEvent.CIDSourceJSON,
		CreatedAt:           domainEvent.CreatedAt,
		Date:                openapi_types.Date{Time: domainEvent.Date},
		Description:         domainEvent.Description,
		EntityId:            domainEvent.EntityID,
		EntityName:          domainEvent.EntityName,
		EntityLogoObjectKey: domainEvent.EntityLogoObjectKey,
		Id:                  domainEvent.ID,
		Images:              httpImages,
		Location:            domainEvent.Location,
		Metadata:            &domainEvent.Metadata,
		Title:               domainEvent.Title,
		Type:                EventType(domainEvent.Type),
		VehicleId:           domainEvent.VehicleID,
	}
}

func getMetadataValue(metadata *map[string]interface{}) map[string]interface{} {
	if metadata == nil {
		return nil
	}
	return *metadata
}
