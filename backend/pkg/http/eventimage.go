package http

import (
	"context"
	"errors"

	"github.com/ClassicCarsRestore/ClassicsChain/eventimages"
)

func (a apiServer) CreateEventImageUploadSession(ctx context.Context, _ CreateEventImageUploadSessionRequestObject) (CreateEventImageUploadSessionResponseObject, error) {
	if err := a.authorizer.Authorize(ctx, ResourceOwnerEvents, ActionCreate); err != nil {
		return CreateEventImageUploadSession403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	sessionID := a.eventImageService.CreateUploadSession()

	return CreateEventImageUploadSession201JSONResponse{
		SessionId: sessionID,
	}, nil
}

func (a apiServer) GenerateEventImageUploadUrl(ctx context.Context, request GenerateEventImageUploadUrlRequestObject) (GenerateEventImageUploadUrlResponseObject, error) {
	if request.Body == nil {
		return GenerateEventImageUploadUrl400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Request body is required",
			},
		}, nil
	}

	if err := a.authorizer.Authorize(ctx, ResourceOwnerEvents, ActionCreate); err != nil {
		return GenerateEventImageUploadUrl403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "forbidden",
			},
		}, nil
	}

	fileExtension := eventimages.GetFileExtension(request.Body.Filename)

	image, err := a.eventImageService.GenerateUploadURL(ctx, eventimages.GenerateUploadParams{
		SessionID:     request.SessionId,
		Filename:      request.Body.Filename,
		FileExtension: fileExtension,
	})
	if err != nil {
		if errors.Is(err, eventimages.ErrMaxImagesExceeded) {
			return GenerateEventImageUploadUrl400JSONResponse{
				BadRequestJSONResponse: BadRequestJSONResponse{
					Error: "Session has reached maximum number of images (10)",
				},
			}, nil
		}
		return nil, err
	}

	if image.UploadURL == nil {
		return GenerateEventImageUploadUrl400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Failed to generate upload URL",
			},
		}, nil
	}

	return GenerateEventImageUploadUrl200JSONResponse{
		ImageId:   image.ID,
		UploadUrl: *image.UploadURL,
	}, nil
}

func (a apiServer) ConfirmEventImageUpload(ctx context.Context, request ConfirmEventImageUploadRequestObject) (ConfirmEventImageUploadResponseObject, error) {
	if err := a.authorizer.Authorize(ctx, ResourceOwnerEvents, ActionCreate); err != nil {
		return ConfirmEventImageUpload401JSONResponse{
			UnauthorizedJSONResponse: UnauthorizedJSONResponse{
				Error: "unauthorized",
			},
		}, nil
	}

	image, err := a.eventImageService.ConfirmUpload(ctx, request.ImageId)
	if err != nil {
		if errors.Is(err, eventimages.ErrEventImageNotFound) {
			return ConfirmEventImageUpload404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "Image not found",
				},
			}, nil
		}
		return nil, err
	}

	return ConfirmEventImageUpload200JSONResponse(domainToHTTPEventImage(*image)), nil
}

func (a apiServer) GetEventImagesBySession(ctx context.Context, request GetEventImagesBySessionRequestObject) (GetEventImagesBySessionResponseObject, error) {
	if err := a.authorizer.Authorize(ctx, ResourceOwnerEvents, ActionCreate); err != nil {
		return GetEventImagesBySession401JSONResponse{
			UnauthorizedJSONResponse: UnauthorizedJSONResponse{
				Error: "unauthorized",
			},
		}, nil
	}

	images, err := a.eventImageService.ListBySession(ctx, request.SessionId)
	if err != nil {
		return nil, err
	}

	httpImages := make([]EventImage, len(images))
	for i, img := range images {
		httpImages[i] = domainToHTTPEventImage(img)
	}

	return GetEventImagesBySession200JSONResponse{
		Data: httpImages,
	}, nil
}

func (a apiServer) GetEventImages(ctx context.Context, request GetEventImagesRequestObject) (GetEventImagesResponseObject, error) {
	evt, err := a.eventService.GetByID(ctx, request.EventId)
	if err != nil {
		return nil, err
	}
	if evt == nil {
		return GetEventImages404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Event not found",
			},
		}, nil
	}

	images, err := a.eventImageService.ListByEvent(ctx, request.EventId)
	if err != nil {
		return nil, err
	}

	httpImages := make([]EventImage, len(images))
	for i, img := range images {
		httpImages[i] = domainToHTTPEventImage(img)
	}

	return GetEventImages200JSONResponse{
		Data: httpImages,
	}, nil
}

func (a apiServer) DeleteEventImage(ctx context.Context, request DeleteEventImageRequestObject) (DeleteEventImageResponseObject, error) {
	if err := a.authorizer.Authorize(ctx, ResourceOwnerEvents, ActionCreate); err != nil {
		return DeleteEventImage401JSONResponse{
			UnauthorizedJSONResponse: UnauthorizedJSONResponse{
				Error: "unauthorized",
			},
		}, nil
	}

	err := a.eventImageService.Delete(ctx, request.ImageId)
	if err != nil {
		if errors.Is(err, eventimages.ErrEventImageNotFound) {
			return DeleteEventImage404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "Image not found",
				},
			}, nil
		}
		if errors.Is(err, eventimages.ErrImageAlreadyAttached) {
			return DeleteEventImage400JSONResponse{
				BadRequestJSONResponse: BadRequestJSONResponse{
					Error: "Cannot delete image already attached to an event",
				},
			}, nil
		}
		return nil, err
	}

	return DeleteEventImage204Response{}, nil
}

func domainToHTTPEventImage(img eventimages.EventImage) EventImage {
	result := EventImage{
		Id:              img.ID,
		UploadSessionId: img.UploadSessionID,
		ObjectKey:       img.ObjectKey,
		CreatedAt:       img.CreatedAt,
	}

	if img.EventID != nil {
		result.EventId = img.EventID
	}
	if img.CID != nil {
		result.Cid = img.CID
	}

	return result
}
