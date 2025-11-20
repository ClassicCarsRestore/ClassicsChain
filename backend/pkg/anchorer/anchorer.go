package anchorer

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/s1moe2/classics-chain/event"
	"github.com/s1moe2/classics-chain/pkg/algorand"
	"github.com/s1moe2/classics-chain/vehicles"
)

const (
	AlgorandVehicleAssetNamePrefix = "CC_"
	AssetMetadataBaseURL           = "https://vehicle.classicschain.com" // TODO make configurable
)

type vehicleUpdateType string

const (
	vehicleUpdateTypeGenesis       vehicleUpdateType = "genesis"
	vehicleUpdateTypeNewEvent      vehicleUpdateType = "new_event"
	vehicleUpdateTypeVehicleUpdate vehicleUpdateType = "vehicle_update"
)

type AssetManager interface {
	CreateAsset(ctx context.Context, params algorand.AssetParams) (uint64, string, error)
	SelfTransferAsset(ctx context.Context, assetID uint64, note []byte) (string, error)
}

type VehicleRepository interface {
	Update(ctx context.Context, vehicle *vehicles.Vehicle) error
}

type EventRepository interface {
	Update(ctx context.Context, evt event.Event) error
}

type Anchorer struct {
	ac          AssetManager
	vehicleRepo VehicleRepository
	eventRepo   EventRepository
}

func New(ac AssetManager, vehicleRepo VehicleRepository, eventRepo EventRepository) *Anchorer {
	return &Anchorer{ac, vehicleRepo, eventRepo}
}

// VehicleGenesis generates a deterministic CID for the vehicle and anchors it on the blockchain.
// The CID is stored in the Algorand asset's note field for verification purposes.
func (a *Anchorer) VehicleGenesis(ctx context.Context, vehicle vehicles.Vehicle) (*string, error) {
	cidData, err := GenerateCID(vehicleToVehicleRecord(vehicle))
	if err != nil {
		return nil, fmt.Errorf("anchorer genesis failed to generate cid: %w", err)
	}

	assetID, txnID, err := a.ac.CreateAsset(ctx, algorand.AssetParams{
		AssetName: AlgorandVehicleAssetNamePrefix + UUIDToBase64(vehicle.ID),
		UnitName:  "CCV",
		URL:       fmt.Sprintf("%s/%s", AssetMetadataBaseURL, vehicle.ID.String()),
		Total:     1,
		Note:      []byte(vehicleUpdateNote(vehicleUpdateTypeNewEvent, cidData.CID)),
	})
	if err != nil {
		return nil, fmt.Errorf("anchorer genesis failed to create algorand asset: %w", err)
	}

	log.Printf("created algorand asset %d (CID: %s) on transaction %s", assetID, cidData.CID, txnID)

	vehicle.BlockchainAssetID = ptr(fmt.Sprintf("%d", assetID))
	vehicle.CID = &cidData.CID
	vehicle.CIDSourceJSON = &cidData.SourceJSON
	vehicle.CIDSourceCBOR = &cidData.SourceCBOR

	err = a.vehicleRepo.Update(ctx, &vehicle)
	if err != nil {
		return nil, fmt.Errorf("anchorer genesis failed to update vehicle: %w", err)
	}

	return vehicle.BlockchainAssetID, nil
}

// AnchorEvent generates a new CID for the .............
// and anchors the updated CID on the blockchain via a self-transfer transaction.
func (a *Anchorer) AnchorEvent(ctx context.Context, vehicle vehicles.Vehicle, event event.Event) error {
	var vehicleAssetID uint64
	var err error

	if vehicle.BlockchainAssetID != nil {
		vehicleAssetID, err = strconv.ParseUint(*vehicle.BlockchainAssetID, 10, 64)
		if err != nil {
			return fmt.Errorf("parse asset id: %w", err)
		}
	} else {
		assetId, err := a.VehicleGenesis(ctx, vehicle)
		if err != nil {
			return fmt.Errorf("anchorer event update failed to perform vehicle genesis: %w", err)
		}

		vehicleAssetID, err = strconv.ParseUint(*assetId, 10, 64)
		if err != nil {
			return fmt.Errorf("parse asset id: %w", err)
		}
	}

	cidData, err := GenerateCID(eventToEventRecord(event))
	if err != nil {
		return fmt.Errorf("anchorer event update failed to generate cid: %w", err)
	}

	txnId, err := a.ac.SelfTransferAsset(ctx, vehicleAssetID, []byte(vehicleUpdateNote(vehicleUpdateTypeNewEvent, cidData.CID)))
	if err != nil {
		return fmt.Errorf("anchorer event update failed to transfer algorand asset: %w", err)
	}

	log.Printf("updated algorand asset %d (CID: %s) on transaction %s", vehicleAssetID, cidData.CID, txnId)

	event.BlockchainTxID = &txnId
	event.CID = &cidData.CID
	event.CIDSourceJSON = &cidData.SourceJSON
	event.CIDSourceCBOR = &cidData.SourceCBOR

	err = a.eventRepo.Update(ctx, event)
	if err != nil {
		return fmt.Errorf("anchorer genesis failed to update vehicle: %w", err)
	}

	return nil
}

func vehicleUpdateNote(updateType vehicleUpdateType, cid string) string {
	return fmt.Sprintf("type=%s|cid=%s", updateType, cid)
}

func ptr[T any](v T) *T {
	return &v
}

func UUIDToBase64(u uuid.UUID) string {
	encoded := base64.URLEncoding.EncodeToString(u[:])
	return strings.TrimRight(encoded, "=")
}
