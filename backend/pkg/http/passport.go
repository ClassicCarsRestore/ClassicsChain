package http

import (
	"context"
)

func (a apiServer) GetVehiclePassport(ctx context.Context, request GetVehiclePassportRequestObject) (GetVehiclePassportResponseObject, error) {
	vehicle, err := a.vehicleService.GetByID(ctx, request.VehicleId)
	if err != nil {
		return GetVehiclePassport404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Vehicle not found",
				Code:  "not_found",
			},
		}, nil
	}
	if vehicle == nil {
		return GetVehiclePassport404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Vehicle not found",
				Code:  "not_found",
			},
		}, nil
	}

	// Strip sensitive fields
	vehicle.OwnerID = nil
	vehicle.ChassisNumber = nil
	vehicle.EngineNumber = nil
	vehicle.TransmissionNumber = nil
	vehicle.CIDSourceCBOR = nil
	vehicle.CIDSourceJSON = nil

	// Fetch photos
	dbPhotos, err := a.photoService.GetByVehicleID(ctx, request.VehicleId)
	var httpPhotos *[]Photo
	if err == nil {
		photos := make([]Photo, len(dbPhotos))
		for i, p := range dbPhotos {
			photos[i] = domainToHTTPPhoto(p)
		}
		httpPhotos = &photos
	}

	// Fetch events + images (only certified events for public view)
	dbEvents, _, err := a.eventService.GetByVehicle(ctx, request.VehicleId, 100, 0)
	var httpEvents *[]Event
	if err == nil {
		events := make([]Event, 0, len(dbEvents))
		for _, e := range dbEvents {
			if e.EntityID == nil {
				continue
			}
			images, _ := a.eventImageService.ListByEvent(ctx, e.ID)
			events = append(events, domainToHTTPEvent(e, images))
		}
		httpEvents = &events
	}

	return GetVehiclePassport200JSONResponse{
		Vehicle: domainToHTTPVehicle(*vehicle),
		Photos:  httpPhotos,
		History: httpEvents,
	}, nil
}
