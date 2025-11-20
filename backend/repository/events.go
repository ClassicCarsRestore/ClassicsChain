package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"github.com/s1moe2/classics-chain/event"
	"github.com/s1moe2/classics-chain/pkg/postgres"
	"github.com/s1moe2/classics-chain/pkg/postgres/db"
)

type EventRepository struct {
	queries db.Querier
}

func NewEventRepository(queries db.Querier) *EventRepository {
	return &EventRepository{queries: queries}
}

func (r *EventRepository) GetByVehicle(ctx context.Context, vehicleID uuid.UUID, limit, offset int) ([]event.Event, int, error) {
	events, err := r.queries.ListEventsByVehicle(ctx, vehicleID)
	if err != nil {
		return nil, 0, postgres.WrapError(err, "list events by vehicle")
	}

	start := offset
	end := offset + limit
	if start > len(events) {
		start = len(events)
	}
	if end > len(events) {
		end = len(events)
	}

	result := make([]event.Event, end-start)
	for i, e := range events[start:end] {
		result[i] = toEventDomain(e)
	}

	return result, len(events), nil
}

func (r *EventRepository) GetByID(ctx context.Context, id uuid.UUID) (*event.Event, error) {
	e, err := r.queries.GetEvent(ctx, id)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, event.ErrEventNotFound
		}
		return nil, postgres.WrapError(err, "get event")
	}

	result := toEventDomain(e)
	return &result, nil
}

func (r *EventRepository) Create(ctx context.Context, evt event.Event) (*event.Event, error) {
	metadataJSON, err := json.Marshal(evt.Metadata)
	if err != nil {
		return nil, fmt.Errorf("marshal metadata: %w", err)
	}

	created, err := r.queries.CreateEvent(ctx, db.CreateEventParams{
		VehicleID:   evt.VehicleID,
		EntityID:    evt.EntityID,
		EventType:   strings.ToLower(string(evt.Type)),
		Title:       evt.Title,
		Description: stringToNullable(evt.Description),
		EventDate:   evt.Date,
		Location:    stringToNullable(evt.Location),
		Metadata:    metadataJSON,
	})
	if err != nil {
		return nil, postgres.WrapError(err, "create event")
	}

	evt = toEventDomain(created)
	return &evt, nil
}

func (r *EventRepository) Update(ctx context.Context, evt event.Event) error {
	metadataJSON, err := json.Marshal(evt.Metadata)
	if err != nil {
		return fmt.Errorf("marshal metadata: %w", err)
	}

	blockchainTxID := ""
	if evt.BlockchainTxID != nil {
		blockchainTxID = *evt.BlockchainTxID
	}

	_, err = r.queries.UpdateEvent(ctx, db.UpdateEventParams{
		ID:               evt.ID,
		Title:            evt.Title,
		Description:      stringToNullable(evt.Description),
		EventDate:        evt.Date,
		Location:         stringToNullable(evt.Location),
		Metadata:         metadataJSON,
		Cid:              evt.CID,
		CidSourceJson:    evt.CIDSourceJSON,
		CidSourceCborB64: evt.CIDSourceCBOR,
		BlockchainTxID:   blockchainTxID,
	})
	if err != nil {
		return postgres.WrapError(err, "update event")
	}

	//*evt = toEventDomain(updated)   TODO return event
	return nil
}

func (r *EventRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return postgres.WrapError(r.queries.DeleteEvent(ctx, id), "delete event")
}

func toEventDomain(e db.Event) event.Event {
	var metadata map[string]interface{}
	if len(e.Metadata) > 0 {
		json.Unmarshal(e.Metadata, &metadata)
	}

	return event.Event{
		ID:             e.ID,
		VehicleID:      e.VehicleID,
		EntityID:       e.EntityID,
		Type:           event.EventType(e.EventType),
		Title:          e.Title,
		Description:    nullableToStringPtr(e.Description),
		Date:           e.EventDate,
		Location:       nullableToStringPtr(e.Location),
		Metadata:       metadata,
		BlockchainTxID: nullableToStringPtr(e.BlockchainTxID),
		CID:            e.Cid,
		CIDSourceJSON:  e.CidSourceJson,
		CIDSourceCBOR:  e.CidSourceCborB64,
		CreatedAt:      e.CreatedAt,
	}
}
