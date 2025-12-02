package main

import (
	"context"
	"log"
	"time"

	"github.com/casbin/casbin/v2"
	"github.com/kelseyhightower/envconfig"
	"github.com/s1moe2/classics-chain/auth"
	"github.com/s1moe2/classics-chain/documents"
	"github.com/s1moe2/classics-chain/entity"
	"github.com/s1moe2/classics-chain/event"
	"github.com/s1moe2/classics-chain/invitation"
	"github.com/s1moe2/classics-chain/photos"
	"github.com/s1moe2/classics-chain/pkg/algorand"
	"github.com/s1moe2/classics-chain/pkg/anchorer"
	"github.com/s1moe2/classics-chain/pkg/http"
	"github.com/s1moe2/classics-chain/pkg/hydra"
	"github.com/s1moe2/classics-chain/pkg/kratos"
	"github.com/s1moe2/classics-chain/pkg/mailer"
	"github.com/s1moe2/classics-chain/pkg/postgres"
	"github.com/s1moe2/classics-chain/pkg/postgres/db"
	"github.com/s1moe2/classics-chain/pkg/seed"
	"github.com/s1moe2/classics-chain/pkg/storage"
	"github.com/s1moe2/classics-chain/repository"
	"github.com/s1moe2/classics-chain/user"
	"github.com/s1moe2/classics-chain/user_invitation"
	"github.com/s1moe2/classics-chain/vehicles"
	"github.com/s1moe2/classics-chain/vehicleshare"
)

type Config struct {
	Database struct {
		Host     string `envconfig:"DB_HOST" default:"localhost"`
		Port     int    `envconfig:"DB_PORT" default:"5433"`
		User     string `envconfig:"DB_USER" default:"postgres"`
		Password string `envconfig:"DB_PASSWORD" default:"postgres"`
		Database string `envconfig:"DB_NAME" default:"classics_chain"`
		SSLMode  string `envconfig:"DB_SSL_MODE" default:"disable"`
	}
	Kratos struct {
		PublicURL string `envconfig:"KRATOS_PUBLIC_URL" default:"http://localhost:4433"`
		AdminURL  string `envconfig:"KRATOS_ADMIN_URL" default:"http://localhost:4434"`
	}
	Hydra struct {
		AdminURL  string `envconfig:"HYDRA_ADMIN_URL" default:"http://localhost:4445"`
		PublicURL string `envconfig:"HYDRA_PUBLIC_URL" default:"http://localhost:4444"`
	}
	Algorand struct {
		AlgodURL   string `envconfig:"ALGORAND_ALGOD_URL"`
		AlgodToken string `envconfig:"ALGORAND_ALGOD_TOKEN"`
		IndexerURL string `envconfig:"ALGORAND_INDEXER_URL"`
		Mnemonic   string `envconfig:"ALGORAND_WALLET_MNEMONIC"`
		Network    string `envconfig:"ALGORAND_NETWORK" default:"testnet"`
	}
	Storage struct {
		Endpoint       string `envconfig:"STORAGE_ENDPOINT" default:"localhost:9000"`
		PublicEndpoint string `envconfig:"STORAGE_PUBLIC_ENDPOINT"`
		AccessKey      string `envconfig:"STORAGE_ACCESS_KEY" default:"garageuser"`
		SecretKey      string `envconfig:"STORAGE_SECRET_KEY" default:"garagepassword"`
		UseSSL         bool   `envconfig:"STORAGE_USE_SSL" default:"false"`
	}
	HTTP struct {
		Port           int `envconfig:"HTTP_PORT" default:"8080"`
		ReadTimeout    int `envconfig:"HTTP_READ_TIMEOUT" default:"30"`
		WriteTimeout   int `envconfig:"HTTP_WRITE_TIMEOUT" default:"30"`
		IdleTimeout    int `envconfig:"HTTP_IDLE_TIMEOUT" default:"120"`
		MaxHeaderBytes int `envconfig:"HTTP_MAX_HEADER_BYTES" default:"1048576"`
		CORS           struct {
			AllowedOrigins   []string `envconfig:"CORS_ALLOWED_ORIGINS" default:"http://localhost:5173"`
			AllowedMethods   []string `envconfig:"CORS_ALLOWED_METHODS" default:"GET,POST,PUT,PATCH,DELETE,OPTIONS"`
			AllowedHeaders   []string `envconfig:"CORS_ALLOWED_HEADERS" default:"Authorization,Content-Type,X-Session-Token"`
			ExposedHeaders   []string `envconfig:"CORS_EXPOSED_HEADERS" default:"Content-Type"`
			AllowCredentials bool     `envconfig:"CORS_ALLOW_CREDENTIALS" default:"true"`
			MaxAge           int      `envconfig:"CORS_MAX_AGE" default:"3600"`
		}
	}
	Seed struct {
		Enabled       bool   `envconfig:"SEED_ADMIN" default:"false"`
		AdminEmail    string `envconfig:"ADMIN_EMAIL"`
		AdminPassword string `envconfig:"ADMIN_PASSWORD"`
	}
	Mailer struct {
		ResendAPIKey string `envconfig:"RESEND_API_KEY" required:"true"`
		FromEmail    string `envconfig:"MAILER_FROM_EMAIL" default:"noreply@classicschain.com"`
		FromName     string `envconfig:"MAILER_FROM_NAME" default:"Classics Chain"`
		BaseURL      string `envconfig:"MAILER_BASE_URL" default:"http://localhost:5173"`
	}
}

func main() {
	ctx := context.Background()

	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		log.Fatalf("Failed to process environment variables: %v", err)
	}

	// Database configuration
	dbCfg := postgres.Config{
		Host:     cfg.Database.Host,
		Port:     cfg.Database.Port,
		User:     cfg.Database.User,
		Password: cfg.Database.Password,
		Database: cfg.Database.Database,
		SSLMode:  cfg.Database.SSLMode,
	}

	// Initialize database connection pool
	pool, err := postgres.NewPool(ctx, dbCfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	log.Println("Database connection established")

	querier := db.New(pool)

	// Initialize Kratos client (needed for authentication)
	kratosClient := kratos.New(cfg.Kratos.PublicURL, cfg.Kratos.AdminURL)

	// Initialize Hydra client (needed for OAuth2)
	hydraClient := hydra.New(cfg.Hydra.AdminURL)

	// Seed admin user if enabled
	if cfg.Seed.Enabled {
		log.Println("Admin seeding is enabled, creating admin user...")

		if cfg.Seed.AdminEmail == "" || cfg.Seed.AdminPassword == "" {
			log.Fatal("ADMIN_EMAIL and ADMIN_PASSWORD are required when SEED_ADMIN=true")
		}

		err = seed.SeedAdminUser(ctx, kratosClient, querier, seed.AdminUserConfig{
			Email:    cfg.Seed.AdminEmail,
			Password: cfg.Seed.AdminPassword,
		})
		if err != nil {
			log.Fatalf("Failed to seed admin user: %v", err)
		}
		log.Printf("Admin user ready: %s", cfg.Seed.AdminEmail)
	}

	// Initialize repositories
	entityRepo := repository.NewEntityRepository(querier)
	eventRepo := repository.NewEventRepository(querier)
	vehicleRepo := repository.NewVehicleRepository(querier)
	photoRepo := repository.NewPhotoRepository(querier)
	userRepo := repository.NewUserRepository(querier)
	documentRepo := repository.NewDocumentRepository(querier)
	shareLinkRepo := repository.NewShareLinkRepository(querier)
	invitationRepo := repository.NewInvitationRepository(querier)

	// Initialize storage backend
	photoStorage, err := storage.New(storage.Config{
		Endpoint:       cfg.Storage.Endpoint,
		PublicEndpoint: cfg.Storage.PublicEndpoint,
		AccessKey:      cfg.Storage.AccessKey,
		SecretKey:      cfg.Storage.SecretKey,
		UseSSL:         cfg.Storage.UseSSL,
		PublicBuckets:  []string{storage.VehiclesBucket},
	})
	if err != nil {
		log.Fatalf("Failed to initialize Garage storage: %v", err)
	}
	log.Println("Storage backend initialized: Garage")

	// Initialize Algorand client
	algorandClient, err := algorand.New(algorand.Config{
		AlgodURL:   cfg.Algorand.AlgodURL,
		AlgodToken: cfg.Algorand.AlgodToken,
		IndexerURL: cfg.Algorand.IndexerURL,
		Mnemonic:   cfg.Algorand.Mnemonic,
	})
	if err != nil {
		log.Fatalf("Failed to initialize Algorand client: %v", err)
	}

	if algorandClient.IsOnline(ctx) {
		log.Printf("Algorand client connected (network: %s, address: %s)", cfg.Algorand.Network, algorandClient.Address())
	} else {
		log.Fatalf("Algorand client is offline")
	}

	// Initialize mailer
	mailerClient := mailer.New(mailer.Config{
		APIKey:    cfg.Mailer.ResendAPIKey,
		FromEmail: cfg.Mailer.FromEmail,
		FromName:  cfg.Mailer.FromName,
		BaseURL:   cfg.Mailer.BaseURL,
	})

	// Initialize repositories
	userInvitationRepo := repository.NewUserInvitationRepository(querier)

	// Initialize services
	anchorerService := anchorer.New(algorandClient, vehicleRepo, eventRepo)
	vehicleService := vehicles.NewService(vehicleRepo, anchorerService)
	photoService := photos.NewService(photoRepo, photoStorage)
	documentService := documents.NewService(documentRepo, photoStorage)
	shareLinksService := vehicleshare.NewService(shareLinkRepo)
	invitationService := invitation.NewService(invitationRepo, vehicleService, mailerClient)
	eventService := event.NewService(eventRepo, anchorerService, vehicleService, invitationService)

	// User invitation service
	userInvitationService := user_invitation.NewService(userInvitationRepo, mailerClient)

	// User service with dependencies
	userService := user.New(userRepo, kratosClient)
	userService.SetUserInvitationService(userInvitationService)

	// Entity service with user invitation service
	entityService := entity.New(entityRepo, userRepo, kratosClient, userService, hydraClient, userInvitationService)

	// Initialize Casbin enforcer
	enforcer, err := casbin.NewEnforcer("casbin_model.conf", "casbin_policy.csv")
	if err != nil {
		log.Fatalf("Failed to initialize Casbin enforcer: %v", err)
	}
	log.Println("Casbin enforcer initialized")

	// Initialize authorization
	authorizer := auth.NewAuthorizer(enforcer, userService)

	// Initialize middleware with OAuth2 support
	authMiddleware := auth.NewMiddlewareWithOAuth2(kratosClient, hydraClient, userService)

	// HTTP server configuration
	httpCfg := http.Config{
		Port:           cfg.HTTP.Port,
		ReadTimeout:    time.Duration(cfg.HTTP.ReadTimeout) * time.Second,
		WriteTimeout:   time.Duration(cfg.HTTP.WriteTimeout) * time.Second,
		IdleTimeout:    time.Duration(cfg.HTTP.IdleTimeout) * time.Second,
		MaxHeaderBytes: cfg.HTTP.MaxHeaderBytes,
		CORS: http.CORSConfig{
			AllowedOrigins:   cfg.HTTP.CORS.AllowedOrigins,
			AllowedMethods:   cfg.HTTP.CORS.AllowedMethods,
			AllowedHeaders:   cfg.HTTP.CORS.AllowedHeaders,
			ExposedHeaders:   cfg.HTTP.CORS.ExposedHeaders,
			AllowCredentials: cfg.HTTP.CORS.AllowCredentials,
			MaxAge:           cfg.HTTP.CORS.MaxAge,
		},
	}

	server := http.New(httpCfg, entityService, eventService, vehicleService, photoService, documentService, shareLinksService, userService, invitationService, userInvitationService, kratosClient, authMiddleware, authorizer)

	log.Printf("Starting HTTP server on port %d", httpCfg.Port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
