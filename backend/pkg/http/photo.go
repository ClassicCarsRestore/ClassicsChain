package http

import (
	"context"
	"errors"

	"github.com/s1moe2/classics-chain/photos"
)

func (a apiServer) GetVehiclePhotos(ctx context.Context, request GetVehiclePhotosRequestObject) (GetVehiclePhotosResponseObject, error) {
	_, err := a.checkVehicleAccess(ctx, request.VehicleId)
	if err != nil {
		if errors.Is(err, ErrVehicleNotFound) {
			return GetVehiclePhotos404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "vehicle not found",
				},
			}, nil
		}
		if errors.Is(err, ErrAuthenticationRequired) {
			return GetVehiclePhotos401JSONResponse{
				UnauthorizedJSONResponse: UnauthorizedJSONResponse{
					Error: "Authentication required",
				},
			}, nil
		}
		if errors.Is(err, ErrForbiddenVehicleAccess) {
			return GetVehiclePhotos403JSONResponse{
				ForbiddenJSONResponse: ForbiddenJSONResponse{
					Error: "forbidden",
				},
			}, nil
		}
		return nil, err
	}

	photoList, err := a.photoService.GetByVehicleID(ctx, request.VehicleId)
	if err != nil {
		return nil, err
	}

	httpPhotos := make([]Photo, len(photoList))
	for i, p := range photoList {
		httpPhotos[i] = domainToHTTPPhoto(p)
	}

	return GetVehiclePhotos200JSONResponse{
		Data: httpPhotos,
	}, nil
}

func (a apiServer) GeneratePhotoUploadUrl(ctx context.Context, request GeneratePhotoUploadUrlRequestObject) (GeneratePhotoUploadUrlResponseObject, error) {
	if request.Body == nil {
		return GeneratePhotoUploadUrl400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Request body is required",
			},
		}, nil
	}

	vehicle, err := a.vehicleService.GetByID(ctx, request.VehicleId)
	if err != nil {
		return nil, err
	}

	if !isVehicleOwner(ctx, vehicle) {
		return GeneratePhotoUploadUrl403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "Forbidden: You don't have permission to upload photos for this vehicle",
			},
		}, nil
	}

	fileExtension := extractFileExtension(request.Body.Filename)
	photo, err := a.photoService.GenerateUploadURL(ctx, photos.GenerateUploadParams{
		VehicleID:     request.VehicleId,
		Filename:      request.Body.Filename,
		FileExtension: fileExtension,
	})
	if err != nil {
		if errors.Is(err, photos.ErrMaxPhotosExceeded) {
			return GeneratePhotoUploadUrl400JSONResponse{
				BadRequestJSONResponse: BadRequestJSONResponse{
					Error: "Vehicle has reached maximum number of photos (10)",
				},
			}, nil
		}
		return nil, err
	}

	if photo.UploadURL == nil {
		return GeneratePhotoUploadUrl400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Failed to generate upload URL",
			},
		}, nil
	}

	return GeneratePhotoUploadUrl200JSONResponse{
		PhotoId:   photo.ID,
		UploadUrl: *photo.UploadURL,
	}, nil
}

func (a apiServer) ConfirmPhotoUpload(ctx context.Context, request ConfirmPhotoUploadRequestObject) (ConfirmPhotoUploadResponseObject, error) {
	vehicle, err := a.vehicleService.GetByID(ctx, request.VehicleId)
	if err != nil {
		return nil, err
	}
	if vehicle == nil {
		return ConfirmPhotoUpload404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Vehicle not found",
			},
		}, nil
	}

	if !isVehicleOwner(ctx, vehicle) {
		return ConfirmPhotoUpload403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "Forbidden: You don't have permission to upload photos for this vehicle",
			},
		}, nil
	}

	confirmedPhoto, err := a.photoService.ConfirmPhotoUpload(ctx, request.PhotoId)
	if err != nil {
		if errors.Is(err, photos.ErrPhotoNotFound) {
			return ConfirmPhotoUpload404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "Photo not found",
				},
			}, nil
		}
		return nil, err
	}

	httpPhoto := domainToHTTPPhoto(*confirmedPhoto)
	return ConfirmPhotoUpload200JSONResponse(httpPhoto), nil
}

func (a apiServer) DeleteVehiclePhoto(ctx context.Context, request DeleteVehiclePhotoRequestObject) (DeleteVehiclePhotoResponseObject, error) {
	vehicle, err := a.vehicleService.GetByID(ctx, request.VehicleId)
	if err != nil {
		return nil, err
	}
	if vehicle == nil {
		return DeleteVehiclePhoto404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Vehicle not found",
			},
		}, nil
	}

	if !isVehicleOwner(ctx, vehicle) {
		return DeleteVehiclePhoto403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "Forbidden: Cannot delete photos for orphaned vehicle",
			},
		}, nil
	}

	if err := a.photoService.DeletePhoto(ctx, request.PhotoId); err != nil {
		return nil, err
	}

	return DeleteVehiclePhoto204Response{}, nil
}

func domainToHTTPPhoto(p photos.Photo) Photo {
	return Photo{
		Id:        p.ID,
		VehicleId: p.VehicleID,
		ObjectKey: p.ObjectKey,
		CreatedAt: p.CreatedAt,
	}
}

func extractFileExtension(filename string) string {
	for i := len(filename) - 1; i >= 0; i-- {
		if filename[i] == '.' {
			return filename[i:]
		}
	}
	return ""
}
