//go:generate go tool oapi-codegen -config oapi-codegen.yaml openapi.yaml

package http

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/rs/cors"
	"github.com/s1moe2/classics-chain/auth"
	"github.com/s1moe2/classics-chain/documents"
	"github.com/s1moe2/classics-chain/entity"
	"github.com/s1moe2/classics-chain/event"
	"github.com/s1moe2/classics-chain/invitation"
	"github.com/s1moe2/classics-chain/photos"
	"github.com/s1moe2/classics-chain/pkg/kratos"
	"github.com/s1moe2/classics-chain/user"
	"github.com/s1moe2/classics-chain/vehicles"
	"github.com/s1moe2/classics-chain/vehicleshare"
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
func New(cfg Config, entityService *entity.Service, eventService *event.Service, vehicleService *vehicles.Service, photoService *photos.Service, documentService *documents.Service, shareLinksService *vehicleshare.Service, userService *user.Service, invitationService *invitation.Service, kratosClient *kratos.Client, authMiddleware *auth.Middleware, authorizer *auth.Authorizer) *http.Server {
	server := &apiServer{
		entityService:     entityService,
		eventService:      eventService,
		vehicleService:    vehicleService,
		photoService:      photoService,
		documentService:   documentService,
		shareLinksService: shareLinksService,
		userService:       userService,
		invitationService: invitationService,
		kratosClient:      kratosClient,
		authorizer:        authorizer,
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
	entityService     *entity.Service
	eventService      *event.Service
	vehicleService    *vehicles.Service
	photoService      *photos.Service
	documentService   *documents.Service
	shareLinksService *vehicleshare.Service
	userService       *user.Service
	invitationService *invitation.Service
	kratosClient      *kratos.Client
	authorizer        *auth.Authorizer
}
