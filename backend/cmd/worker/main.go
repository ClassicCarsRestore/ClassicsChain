package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"

	"github.com/ClassicCarsRestore/ClassicsChain/internal/anchorjob"
	"github.com/ClassicCarsRestore/ClassicsChain/pkg/algorand"
	"github.com/ClassicCarsRestore/ClassicsChain/pkg/anchorer"
	"github.com/ClassicCarsRestore/ClassicsChain/pkg/postgres"
	"github.com/ClassicCarsRestore/ClassicsChain/pkg/postgres/db"
	natsqueue "github.com/ClassicCarsRestore/ClassicsChain/pkg/queue/nats"
	"github.com/ClassicCarsRestore/ClassicsChain/repository"
	"github.com/kelseyhightower/envconfig"
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
	Algorand struct {
		AlgodURL   string `envconfig:"ALGORAND_ALGOD_URL"`
		AlgodToken string `envconfig:"ALGORAND_ALGOD_TOKEN"`
		IndexerURL string `envconfig:"ALGORAND_INDEXER_URL"`
		Mnemonic   string `envconfig:"ALGORAND_WALLET_MNEMONIC"`
		Network    string `envconfig:"ALGORAND_NETWORK" default:"testnet"`
	}
	NATS struct {
		URL string `envconfig:"NATS_URL" default:"nats://localhost:4222"`
	}
}

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		log.Fatalf("Failed to process environment variables: %v", err)
	}

	// Database
	pool, err := postgres.NewPool(ctx, postgres.Config{
		Host:     cfg.Database.Host,
		Port:     cfg.Database.Port,
		User:     cfg.Database.User,
		Password: cfg.Database.Password,
		Database: cfg.Database.Database,
		SSLMode:  cfg.Database.SSLMode,
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()
	log.Println("Database connection established")

	querier := db.New(pool)

	// Repositories
	vehicleRepo := repository.NewVehicleRepository(querier)
	eventRepo := repository.NewEventRepository(querier)

	// Algorand
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

	// NATS subscriber
	natsSubscriber, err := natsqueue.NewSubscriber(ctx, natsqueue.Config{URL: cfg.NATS.URL})
	if err != nil {
		log.Fatalf("Failed to initialize NATS subscriber: %v", err)
	}
	defer natsSubscriber.Close()
	log.Println("NATS JetStream connected")

	// Worker
	anchorerService := anchorer.New(algorandClient, vehicleRepo, eventRepo)
	worker := anchorjob.NewWorker(natsSubscriber, anchorerService, vehicleRepo, eventRepo)

	if err := worker.Start(ctx); err != nil {
		log.Fatalf("Anchor worker stopped: %v", err)
	}
}
