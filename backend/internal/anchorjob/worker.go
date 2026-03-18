package anchorjob

import (
	"context"
	"encoding/json"
	"log"

	"github.com/ClassicCarsRestore/ClassicsChain/internal/event"
	"github.com/ClassicCarsRestore/ClassicsChain/internal/vehicles"
	"github.com/ClassicCarsRestore/ClassicsChain/pkg/queue"
)

const MaxDeliveries = 5

type Anchorer interface {
	VehicleGenesis(ctx context.Context, vehicle vehicles.Vehicle) (*string, error)
	AnchorEvent(ctx context.Context, vehicle vehicles.Vehicle, event event.Event, imageCIDs []string) error
}

type Worker struct {
	subscriber  queue.Subscriber
	anchorer    Anchorer
	vehicleRepo vehicles.Repository
	eventRepo   event.Repository
}

func NewWorker(subscriber queue.Subscriber, anchorer Anchorer, vehicleRepo vehicles.Repository, eventRepo event.Repository) *Worker {
	return &Worker{
		subscriber:  subscriber,
		anchorer:    anchorer,
		vehicleRepo: vehicleRepo,
		eventRepo:   eventRepo,
	}
}

func (w *Worker) Start(ctx context.Context) error {
	if err := w.subscriber.Subscribe(ctx, SubjectVehicleGenesis, w.handleVehicleGenesis); err != nil {
		return err
	}
	if err := w.subscriber.Subscribe(ctx, SubjectEventAnchor, w.handleEventAnchor); err != nil {
		return err
	}

	log.Println("Anchor worker started")
	<-ctx.Done()
	return nil
}

func (w *Worker) handleVehicleGenesis(ctx context.Context, msg queue.Message) error {
	var job VehicleGenesisJob
	if err := json.Unmarshal(msg.Data, &job); err != nil {
		log.Printf("anchor worker: invalid vehicle genesis payload: %v", err)
		return nil // ack — malformed message, no point retrying
	}

	vehicle, err := w.vehicleRepo.GetByID(ctx, job.VehicleID)
	if err != nil {
		log.Printf("anchor worker: vehicle %s not found: %v", job.VehicleID, err)
		return nil // ack — vehicle deleted, nothing to anchor
	}

	_, err = w.anchorer.VehicleGenesis(ctx, *vehicle)
	if err != nil {
		if msg.DeliveryCount >= MaxDeliveries {
			log.Printf("anchor worker: vehicle genesis failed after %d attempts: vehicle=%s err=%v", msg.DeliveryCount, job.VehicleID, err)
			vehicle.BlockchainStatus = "failed"
			if updateErr := w.vehicleRepo.Update(ctx, vehicle); updateErr != nil {
				log.Printf("anchor worker: failed to mark vehicle %s as failed: %v", job.VehicleID, updateErr)
			}
			return nil // ack — give up
		}
		log.Printf("anchor worker: vehicle genesis attempt %d failed: vehicle=%s err=%v", msg.DeliveryCount, job.VehicleID, err)
		return err // nack → redeliver
	}

	// VehicleGenesis already updates vehicle row with asset ID + CID
	vehicle, err = w.vehicleRepo.GetByID(ctx, job.VehicleID)
	if err != nil {
		log.Printf("anchor worker: failed to reload vehicle %s after genesis: %v", job.VehicleID, err)
		return nil
	}
	vehicle.BlockchainStatus = "anchored"
	if err := w.vehicleRepo.Update(ctx, vehicle); err != nil {
		log.Printf("anchor worker: failed to mark vehicle %s as anchored: %v", job.VehicleID, err)
	}
	log.Printf("anchor worker: vehicle %s anchored", job.VehicleID)
	return nil
}

func (w *Worker) handleEventAnchor(ctx context.Context, msg queue.Message) error {
	var job EventAnchorJob
	if err := json.Unmarshal(msg.Data, &job); err != nil {
		log.Printf("anchor worker: invalid event anchor payload: %v", err)
		return nil
	}

	vehicle, err := w.vehicleRepo.GetByID(ctx, job.VehicleID)
	if err != nil {
		log.Printf("anchor worker: vehicle %s not found for event %s: %v", job.VehicleID, job.EventID, err)
		return nil
	}

	evt, err := w.eventRepo.GetByID(ctx, job.EventID)
	if err != nil {
		log.Printf("anchor worker: event %s not found: %v", job.EventID, err)
		return nil
	}

	err = w.anchorer.AnchorEvent(ctx, *vehicle, *evt, job.ImageCIDs)
	if err != nil {
		if msg.DeliveryCount >= MaxDeliveries {
			log.Printf("anchor worker: event anchor failed after %d attempts: event=%s err=%v", msg.DeliveryCount, job.EventID, err)
			evt.BlockchainStatus = "failed"
			if updateErr := w.eventRepo.Update(ctx, *evt); updateErr != nil {
				log.Printf("anchor worker: failed to mark event %s as failed: %v", job.EventID, updateErr)
			}
			return nil
		}
		log.Printf("anchor worker: event anchor attempt %d failed: event=%s err=%v", msg.DeliveryCount, job.EventID, err)
		return err
	}

	// AnchorEvent already updates event row with tx ID + CID
	evt, err = w.eventRepo.GetByID(ctx, job.EventID)
	if err != nil {
		log.Printf("anchor worker: failed to reload event %s after anchoring: %v", job.EventID, err)
		return nil
	}
	evt.BlockchainStatus = "anchored"
	if err := w.eventRepo.Update(ctx, *evt); err != nil {
		log.Printf("anchor worker: failed to mark event %s as anchored: %v", job.EventID, err)
	}
	log.Printf("anchor worker: event %s anchored", job.EventID)
	return nil
}
