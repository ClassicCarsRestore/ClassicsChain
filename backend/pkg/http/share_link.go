package http

import (
	"context"
	"errors"
	"fmt"

	"github.com/s1moe2/classics-chain/vehicleshare"
)

func (a apiServer) GetVehicleShareLinks(ctx context.Context, request GetVehicleShareLinksRequestObject) (GetVehicleShareLinksResponseObject, error) {
	vehicle, err := a.vehicleService.GetByID(ctx, request.VehicleId)
	if err != nil {
		return nil, err
	}

	if vehicle == nil {
		return GetVehicleShareLinks404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Vehicle not found",
			},
		}, nil
	}

	if !isVehicleOwner(ctx, vehicle) {
		return GetVehicleShareLinks403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "Forbidden: You don't have permission to access this vehicle's share links",
			},
		}, nil
	}

	shareLinks, err := a.shareLinksService.ListShareLinks(ctx, vehicle.ID)
	if err != nil {
		return nil, err
	}

	httpShareLinks := make([]ShareLink, len(shareLinks))
	for i, sl := range shareLinks {
		httpShareLinks[i] = domainShareLinkToHTTP(sl)
	}

	return GetVehicleShareLinks200JSONResponse{
		Data: httpShareLinks,
	}, nil
}

func (a apiServer) CreateShareLink(ctx context.Context, request CreateShareLinkRequestObject) (CreateShareLinkResponseObject, error) {
	if request.Body == nil {
		return CreateShareLink400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Request body is required",
			},
		}, nil
	}

	vehicle, err := a.vehicleService.GetByID(ctx, request.VehicleId)
	if err != nil {
		return nil, err
	}

	if vehicle == nil {
		return CreateShareLink404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Vehicle not found",
			},
		}, nil
	}

	if !isVehicleOwner(ctx, vehicle) {
		return CreateShareLink403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "Forbidden: You don't have permission to access this vehicle's share links",
			},
		}, nil
	}

	var recipientEmail *string
	if request.Body.RecipientEmail != nil {
		email := string(*request.Body.RecipientEmail)
		recipientEmail = &email
	}

	shareLink, err := a.shareLinksService.CreateShareLink(ctx, vehicleshare.CreateShareLinkParams{
		VehicleID:        vehicle.ID,
		CanViewDetails:   request.Body.CanViewDetails,
		CanViewPhotos:    request.Body.CanViewPhotos,
		CanViewDocuments: request.Body.CanViewDocuments,
		CanViewHistory:   request.Body.CanViewHistory,
		RecipientEmail:   recipientEmail,
		Duration:         string(request.Body.Duration),
	})
	if err != nil {
		if errors.Is(err, vehicleshare.ErrInvalidDuration) {
			return CreateShareLink400JSONResponse{
				BadRequestJSONResponse: BadRequestJSONResponse{
					Error: "Invalid duration. Must be one of: 1h, 24h, 7d, 30d",
				},
			}, nil
		}
		return nil, err
	}

	baseURL := "http://localhost:3000"
	shareURL := fmt.Sprintf("%s/shared/vehicles/%s", baseURL, shareLink.Token)

	return CreateShareLink201JSONResponse{
		Id:        shareLink.ID,
		VehicleId: shareLink.VehicleID,
		ShareUrl:  shareURL,
		ExpiresAt: shareLink.ExpiresAt,
		Permissions: SharePermissions{
			CanViewDetails:   shareLink.CanViewDetails,
			CanViewPhotos:    shareLink.CanViewPhotos,
			CanViewDocuments: shareLink.CanViewDocuments,
			CanViewHistory:   shareLink.CanViewHistory,
		},
	}, nil
}

func (a apiServer) RevokeShareLink(ctx context.Context, request RevokeShareLinkRequestObject) (RevokeShareLinkResponseObject, error) {
	vehicle, err := a.vehicleService.GetByID(ctx, request.VehicleId)
	if err != nil {
		return nil, err
	}

	if vehicle == nil {
		return RevokeShareLink404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Vehicle not found",
			},
		}, nil
	}

	if !isVehicleOwner(ctx, vehicle) {
		return RevokeShareLink403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "Forbidden: You don't have permission to revoke share links",
			},
		}, nil
	}

	_, err = a.shareLinksService.RevokeShareLink(ctx, request.ShareLinkId)
	if err != nil {
		if errors.Is(err, vehicleshare.ErrShareLinkNotFound) {
			return RevokeShareLink404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "Share link not found",
				},
			}, nil
		}
		return nil, err
	}

	return RevokeShareLink204Response{}, nil
}

func (a apiServer) GetSharedVehicle(ctx context.Context, request GetSharedVehicleRequestObject) (GetSharedVehicleResponseObject, error) {
	shareLink, err := a.shareLinksService.GetSharedVehicleData(ctx, request.Token)
	if err != nil {
		if errors.Is(err, vehicleshare.ErrShareLinkExpired) || errors.Is(err, vehicleshare.ErrShareLinkRevoked) {
			return GetSharedVehicle410JSONResponse{
				Error: "Share link has expired or been revoked",
				Code:  "SHARE_LINK_EXPIRED_OR_REVOKED",
			}, nil
		}
		if errors.Is(err, vehicleshare.ErrShareLinkNotFound) {
			return GetSharedVehicle404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "Share link not found",
					Code:  "SHARE_LINK_NOT_FOUND",
				},
			}, nil
		}
		return nil, err
	}

	vehicle, err := a.vehicleService.GetByID(ctx, shareLink.VehicleID)
	if err != nil {
		return nil, err
	}
	if vehicle == nil {
		return GetSharedVehicle404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Vehicle not found",
				Code:  "VEHICLE_NOT_FOUND",
			},
		}, nil
	}

	var httpPhotos *[]Photo
	if shareLink.CanViewPhotos {
		dbPhotos, err := a.photoService.GetByVehicleID(ctx, shareLink.VehicleID)
		if err == nil {
			photos := make([]Photo, len(dbPhotos))
			for i, p := range dbPhotos {
				photos[i] = domainToHTTPPhoto(p)
			}
			httpPhotos = &photos
		}
	}

	var httpDocuments *[]Document
	if shareLink.CanViewDocuments {
		dbDocuments, err := a.documentService.GetByVehicleID(ctx, shareLink.VehicleID)
		if err == nil {
			documents := make([]Document, len(dbDocuments))
			for i, d := range dbDocuments {
				documents[i] = domainToHTTPDocument(d)
			}
			httpDocuments = &documents
		}
	}

	var httpEvents *[]Event
	if shareLink.CanViewHistory {
		dbEvents, _, err := a.eventService.GetByVehicle(ctx, shareLink.VehicleID, 100, 0)
		if err == nil {
			events := make([]Event, len(dbEvents))
			for i, e := range dbEvents {
				events[i] = domainToHTTPEvent(e)
			}
			httpEvents = &events
		}
	}

	return GetSharedVehicle200JSONResponse{
		Vehicle:   domainToHTTPVehicle(*vehicle),
		Photos:    httpPhotos,
		Documents: httpDocuments,
		History:   httpEvents,
	}, nil
}

func domainShareLinkToHTTP(sl vehicleshare.ShareLink) ShareLink {
	var accessedCount *int
	if sl.AccessedCount > 0 {
		count := sl.AccessedCount
		accessedCount = &count
	}

	return ShareLink{
		Id:        sl.ID,
		VehicleId: sl.VehicleID,
		Token:     sl.Token,
		Permissions: SharePermissions{
			CanViewDetails:   sl.CanViewDetails,
			CanViewPhotos:    sl.CanViewPhotos,
			CanViewDocuments: sl.CanViewDocuments,
			CanViewHistory:   sl.CanViewHistory,
		},
		ExpiresAt:      sl.ExpiresAt,
		AccessedCount:  accessedCount,
		CreatedAt:      &sl.CreatedAt,
		LastAccessedAt: sl.LastAccessedAt,
		RevokedAt:      sl.RevokedAt,
	}
}
