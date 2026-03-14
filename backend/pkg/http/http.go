//go:generate go tool oapi-codegen -config oapi-codegen.yaml openapi.yaml

package http

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/ClassicCarsRestore/ClassicsChain/auth"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/documents"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/entity"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/event"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/eventimages"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/invitation"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/photos"
	"github.com/ClassicCarsRestore/ClassicsChain/pkg/kratos"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/user"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/user_invitation"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/vehicles"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/vehicleshare"
	"github.com/google/uuid"
	"github.com/rs/cors"
)

type Config struct {
	Port           int
	ReadTimeout    time.Duration
	WriteTimeout   time.Duration
	IdleTimeout    time.Duration
	MaxHeaderBytes int
	CORS           CORSConfig
}

type CORSConfig struct {
	AllowedOrigins   []string
	AllowedMethods   []string
	AllowedHeaders   []string
	ExposedHeaders   []string
	AllowCredentials bool
	MaxAge           int
}

// APIErrorResponse is a generic error response with tracking ID
type APIErrorResponse struct {
	Error string `json:"error"`
}

// createResponseErrorHandler returns a custom error handler that logs errors with tracking IDs
func createResponseErrorHandler() func(w http.ResponseWriter, r *http.Request, err error) {
	return func(w http.ResponseWriter, r *http.Request, err error) {
		errorID := uuid.New().String()
		log.Printf("ERROR [%s]: %v (Method: %s, Path: %s)", errorID, err, r.Method, r.RequestURI)

		errResp := APIErrorResponse{
			Error: "Internal error: " + errorID,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(errResp)
	}
}

// New creates a new HTTP server with the API server as its handler.
func New(cfg Config, entityService *entity.Service, eventService *event.Service, vehicleService *vehicles.Service, photoService *photos.Service, documentService *documents.Service, shareLinksService *vehicleshare.Service, userService *user.Service, invitationService *invitation.Service, userInvitationService *user_invitation.Service, eventImageService *eventimages.Service, kratosClient *kratos.Client, authMiddleware *auth.Middleware, authorizer *auth.Authorizer) *http.Server {
	server := &apiServer{
		entityService:         entityService,
		eventService:          eventService,
		vehicleService:        vehicleService,
		photoService:          photoService,
		documentService:       documentService,
		shareLinksService:     shareLinksService,
		userService:           userService,
		invitationService:     invitationService,
		userInvitationService: userInvitationService,
		eventImageService:     eventImageService,
		kratosClient:          kratosClient,
		authorizer:            authorizer,
	}

	// Create strict handler with custom error handler
	errorHandler := createResponseErrorHandler()
	strictHandlerOpts := StrictHTTPServerOptions{
		ResponseErrorHandlerFunc: errorHandler,
	}

	handler := HandlerFromMux(
		NewStrictHandlerWithOptions(server, nil, strictHandlerOpts),
		http.NewServeMux(),
	)

	rootMux := http.NewServeMux()

	// Public endpoints (no auth middleware)
	rootMux.Handle("/v1/public/", http.StripPrefix("/v1", LoggingMiddleware(handler)))
	rootMux.Handle("/v1/shared/", http.StripPrefix("/v1", LoggingMiddleware(handler)))
	rootMux.Handle("/v1/invitations/validate", http.StripPrefix("/v1", LoggingMiddleware(handler)))
	rootMux.Handle("/v1/admin-invitations/", http.StripPrefix("/v1", LoggingMiddleware(handler)))

	// Protected endpoints
	protectedHandler := authMiddleware.Auth(LoggingMiddleware(handler))
	rootMux.Handle("/v1/", http.StripPrefix("/v1", protectedHandler))

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   cfg.CORS.AllowedOrigins,
		AllowedMethods:   cfg.CORS.AllowedMethods,
		AllowedHeaders:   cfg.CORS.AllowedHeaders,
		ExposedHeaders:   cfg.CORS.ExposedHeaders,
		AllowCredentials: cfg.CORS.AllowCredentials,
		MaxAge:           cfg.CORS.MaxAge,
	}).Handler(rootMux)

	httpServer := http.Server{
		Addr:           fmt.Sprintf("0.0.0.0:%d", cfg.Port),
		Handler:        corsHandler,
		ReadTimeout:    cfg.ReadTimeout * time.Second,
		WriteTimeout:   cfg.WriteTimeout * time.Second,
		IdleTimeout:    cfg.IdleTimeout * time.Second,
		MaxHeaderBytes: cfg.MaxHeaderBytes,
	}

	return &httpServer
}

type apiServer struct {
	// TODO replace with interfaces
	entityService         *entity.Service
	eventService          *event.Service
	vehicleService        *vehicles.Service
	photoService          *photos.Service
	documentService       *documents.Service
	shareLinksService     *vehicleshare.Service
	userService           *user.Service
	invitationService     *invitation.Service
	userInvitationService *user_invitation.Service
	eventImageService     *eventimages.Service
	kratosClient          *kratos.Client
	authorizer            *auth.Authorizer
}
