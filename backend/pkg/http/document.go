package http

import (
	"context"
	"errors"

	"github.com/s1moe2/classics-chain/documents"
)

func (a apiServer) GetVehicleDocuments(ctx context.Context, request GetVehicleDocumentsRequestObject) (GetVehicleDocumentsResponseObject, error) {
	// Check vehicle access authorization
	_, err := a.checkVehicleAccess(ctx, request.VehicleId)
	if err != nil {
		if errors.Is(err, ErrVehicleNotFound) {
			return GetVehicleDocuments404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: err.Error(),
				},
			}, nil
		}
		if errors.Is(err, ErrAuthenticationRequired) {
			return GetVehicleDocuments401JSONResponse{
				UnauthorizedJSONResponse: UnauthorizedJSONResponse{
					Error: err.Error(),
				},
			}, nil
		}
		if errors.Is(err, ErrForbiddenVehicleAccess) {
			return GetVehicleDocuments403JSONResponse{
				ForbiddenJSONResponse: ForbiddenJSONResponse{
					Error: err.Error(),
				},
			}, nil
		}
		return nil, err
	}

	documentList, err := a.documentService.GetByVehicleID(ctx, request.VehicleId)
	if err != nil {
		return nil, err
	}

	httpDocuments := make([]Document, len(documentList))
	for i, d := range documentList {
		httpDocuments[i] = domainToHTTPDocument(d)
	}

	return GetVehicleDocuments200JSONResponse{
		Data: httpDocuments,
	}, nil
}

func (a apiServer) GenerateDocumentUploadUrl(ctx context.Context, request GenerateDocumentUploadUrlRequestObject) (GenerateDocumentUploadUrlResponseObject, error) {
	if request.Body == nil {
		return GenerateDocumentUploadUrl400JSONResponse{
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
		return GenerateDocumentUploadUrl404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Vehicle not found",
			},
		}, nil
	}

	if !isVehicleOwner(ctx, vehicle) {
		return GenerateDocumentUploadUrl403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "Forbidden: You don't have permission to upload documents for this vehicle",
			},
		}, nil
	}

	fileExtension := extractFileExtension(request.Body.Filename)
	document, err := a.documentService.GenerateUploadURL(ctx, documents.GenerateUploadParams{
		VehicleID:     request.VehicleId,
		Filename:      request.Body.Filename,
		FileExtension: fileExtension,
	})
	if err != nil {
		if errors.Is(err, documents.ErrMaxDocumentsExceeded) {
			return GenerateDocumentUploadUrl400JSONResponse{
				BadRequestJSONResponse: BadRequestJSONResponse{
					Error: "Vehicle has reached maximum number of documents (20)",
				},
			}, nil
		}
		if errors.Is(err, documents.ErrInvalidFileExtension) {
			return GenerateDocumentUploadUrl400JSONResponse{
				BadRequestJSONResponse: BadRequestJSONResponse{
					Error: "Only PDF files are allowed",
				},
			}, nil
		}
		return nil, err
	}

	if document.UploadURL == nil {
		return GenerateDocumentUploadUrl400JSONResponse{
			BadRequestJSONResponse: BadRequestJSONResponse{
				Error: "Failed to generate upload URL",
			},
		}, nil
	}

	return GenerateDocumentUploadUrl200JSONResponse{
		DocumentId: document.ID,
		UploadUrl:  *document.UploadURL,
	}, nil
}

func (a apiServer) ConfirmDocumentUpload(ctx context.Context, request ConfirmDocumentUploadRequestObject) (ConfirmDocumentUploadResponseObject, error) {
	document, err := a.documentService.GetByID(ctx, request.DocumentId)
	if err != nil {
		if errors.Is(err, documents.ErrDocumentNotFound) {
			return ConfirmDocumentUpload404JSONResponse{
				NotFoundJSONResponse: NotFoundJSONResponse{
					Error: "Document not found",
				},
			}, nil
		}
		return nil, err
	}

	vehicle, err := a.vehicleService.GetByID(ctx, document.VehicleID)
	if err != nil {
		return nil, err
	}
	if vehicle == nil {
		return ConfirmDocumentUpload404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Vehicle not found",
			},
		}, nil
	}

	if !isVehicleOwner(ctx, vehicle) {
		return ConfirmDocumentUpload403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "Forbidden: You don't have permission to upload documents for this vehicle",
			},
		}, nil
	}

	confirmedDocument, err := a.documentService.ConfirmDocumentUpload(ctx, request.DocumentId)
	if err != nil {
		return nil, err
	}

	httpDocument := domainToHTTPDocument(*confirmedDocument)
	return ConfirmDocumentUpload200JSONResponse(httpDocument), nil
}

func (a apiServer) DeleteVehicleDocument(ctx context.Context, request DeleteVehicleDocumentRequestObject) (DeleteVehicleDocumentResponseObject, error) {
	vehicle, err := a.vehicleService.GetByID(ctx, request.VehicleId)
	if err != nil {
		return nil, err
	}
	if vehicle == nil {
		return DeleteVehicleDocument404JSONResponse{
			NotFoundJSONResponse: NotFoundJSONResponse{
				Error: "Vehicle not found",
			},
		}, nil
	}

	if !isVehicleOwner(ctx, vehicle) {
		return DeleteVehicleDocument403JSONResponse{
			ForbiddenJSONResponse: ForbiddenJSONResponse{
				Error: "Forbidden: You don't have permission to delete documents for this vehicle",
			},
		}, nil
	}

	if err := a.documentService.DeleteDocument(ctx, request.DocumentId); err != nil {
		return nil, err
	}

	return DeleteVehicleDocument204Response{}, nil
}

func domainToHTTPDocument(d documents.Document) Document {
	return Document{
		Id:        d.ID,
		VehicleId: d.VehicleID,
		ObjectKey: d.ObjectKey,
		Filename:  d.Filename,
		CreatedAt: d.CreatedAt,
	}
}
