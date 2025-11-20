package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"github.com/s1moe2/classics-chain/pkg/postgres"
	"github.com/s1moe2/classics-chain/pkg/postgres/db"
	"github.com/s1moe2/classics-chain/vehicles"
)

type VehicleRepository struct {
	queries db.Querier
}

func NewVehicleRepository(queries db.Querier) *VehicleRepository {
	return &VehicleRepository{queries: queries}
}

func (r *VehicleRepository) GetAll(ctx context.Context, limit, offset int, ownerID *uuid.UUID) ([]vehicles.Vehicle, int, error) {
	var vhcls []db.Vehicle
	var err error
	var total int64

	if ownerID != nil {
		vhcls, err = r.queries.ListVehiclesByOwner(ctx, db.ListVehiclesByOwnerParams{
			OwnerID: ownerID,
			Limit:   int32(limit),
			Offset:  int32(offset),
		})
		if err != nil {
			return nil, 0, postgres.WrapError(err, "list vehicles by owner")
		}
		total, err = r.queries.CountVehiclesByOwner(ctx, ownerID)
		if err != nil {
			return nil, 0, postgres.WrapError(err, "count vehicles by owner")
		}
	} else {
		vhcls, err = r.queries.ListVehicles(ctx, db.ListVehiclesParams{
			Limit:  int32(limit),
			Offset: int32(offset),
		})
		if err != nil {
			return nil, 0, postgres.WrapError(err, "list vehicles")
		}
		total, err = r.queries.CountVehicles(ctx)
		if err != nil {
			return nil, 0, postgres.WrapError(err, "count vehicles")
		}
	}

	result := make([]vehicles.Vehicle, len(vhcls))
	for i, v := range vhcls {
		result[i] = toVehicleDomain(v)
	}

	return result, int(total), nil
}

func (r *VehicleRepository) GetByID(ctx context.Context, id uuid.UUID) (*vehicles.Vehicle, error) {
	v, err := r.queries.GetVehicle(ctx, id)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, vehicles.ErrVehicleNotFound
		}
		return nil, postgres.WrapError(err, "get vehicle")
	}

	result := toVehicleDomain(v)
	return &result, nil
}

func (r *VehicleRepository) GetByOwnerID(ctx context.Context, ownerID uuid.UUID, limit, offset int) ([]vehicles.Vehicle, int, error) {
	vhcls, err := r.queries.ListVehiclesByOwner(ctx, db.ListVehiclesByOwnerParams{
		OwnerID: &ownerID,
		Limit:   int32(limit),
		Offset:  int32(offset),
	})
	if err != nil {
		return nil, 0, postgres.WrapError(err, "list vehicles by owner")
	}

	total, err := r.queries.CountVehiclesByOwner(ctx, &ownerID)
	if err != nil {
		return nil, 0, postgres.WrapError(err, "count vehicles by owner")
	}

	result := make([]vehicles.Vehicle, len(vhcls))
	for i, v := range vhcls {
		result[i] = toVehicleDomain(v)
	}

	return result, int(total), nil
}

func (r *VehicleRepository) Create(ctx context.Context, vehicle *vehicles.Vehicle) (*vehicles.Vehicle, error) {
	created, err := r.queries.CreateVehicle(ctx, db.CreateVehicleParams{
		LicensePlate:       stringToNullable(vehicle.LicensePlate),
		ChassisNumber:      stringToNullable(vehicle.ChassisNumber),
		Make:               vehicle.Make,
		Model:              vehicle.Model,
		Year:               int32(vehicle.Year),
		Color:              stringToNullable(vehicle.Color),
		EngineNumber:       stringToNullable(vehicle.EngineNumber),
		TransmissionNumber: stringToNullable(vehicle.TransmissionNumber),
		BodyType:           stringToNullable(vehicle.BodyType),
		DriveType:          stringToNullable(vehicle.DriveType),
		GearType:           stringToNullable(vehicle.GearType),
		SuspensionType:     stringToNullable(vehicle.SuspensionType),
		OwnerID:            vehicle.OwnerID,
	})
	if err != nil {
		if errors.Is(err, postgres.ErrDuplicateKey) {
			return nil, vehicles.ErrDuplicateChassisNo
		}
		return nil, postgres.WrapError(err, "create vehicle")
	}

	res := toVehicleDomain(created)
	return &res, nil
}

func (r *VehicleRepository) Update(ctx context.Context, vehicle *vehicles.Vehicle) error {
	updated, err := r.queries.UpdateVehicle(ctx, db.UpdateVehicleParams{
		ID:                 vehicle.ID,
		LicensePlate:       stringToNullable(vehicle.LicensePlate),
		ChassisNumber:      stringToNullable(vehicle.ChassisNumber),
		Make:               vehicle.Make,
		Model:              vehicle.Model,
		Year:               int32(vehicle.Year),
		Color:              stringToNullable(vehicle.Color),
		EngineNumber:       stringToNullable(vehicle.EngineNumber),
		TransmissionNumber: stringToNullable(vehicle.TransmissionNumber),
		BodyType:           stringToNullable(vehicle.BodyType),
		DriveType:          stringToNullable(vehicle.DriveType),
		GearType:           stringToNullable(vehicle.GearType),
		SuspensionType:     stringToNullable(vehicle.SuspensionType),
		OwnerID:            vehicle.OwnerID,
		BlockchainAssetID:  stringToNullable(vehicle.BlockchainAssetID),
		Cid:                vehicle.CID,
		CidSourceJson:      vehicle.CIDSourceJSON,
		CidSourceCborB64:   vehicle.CIDSourceCBOR,
	})
	if err != nil {
		return postgres.WrapError(err, "update vehicle")
	}

	*vehicle = toVehicleDomain(updated)
	return nil
}

func (r *VehicleRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return postgres.WrapError(r.queries.DeleteVehicle(ctx, id), "delete vehicle")
}

func (r *VehicleRepository) GetByChassisNumber(ctx context.Context, chassisNumber string) (*vehicles.Vehicle, error) {
	v, err := r.queries.GetVehicleByChassisNumber(ctx, stringToNullable(&chassisNumber))
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, vehicles.ErrVehicleNotFound
		}
		return nil, postgres.WrapError(err, "get vehicle by chassis number")
	}

	result := toVehicleDomain(v)
	return &result, nil
}

func (r *VehicleRepository) GetByLicensePlate(ctx context.Context, licensePlate string) (*vehicles.Vehicle, error) {
	v, err := r.queries.GetVehicleByLicensePlate(ctx, stringToNullable(&licensePlate))
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, vehicles.ErrVehicleNotFound
		}
		return nil, postgres.WrapError(err, "get vehicle by license plate")
	}

	result := toVehicleDomain(v)
	return &result, nil
}

func toVehicleDomain(v db.Vehicle) vehicles.Vehicle {
	return vehicles.Vehicle{
		ID:                 v.ID,
		LicensePlate:       nullableToStringPtr(v.LicensePlate),
		ChassisNumber:      nullableToStringPtr(v.ChassisNumber),
		Make:               v.Make,
		Model:              v.Model,
		Year:               int(v.Year),
		Color:              nullableToStringPtr(v.Color),
		EngineNumber:       nullableToStringPtr(v.EngineNumber),
		TransmissionNumber: nullableToStringPtr(v.TransmissionNumber),
		BodyType:           nullableToStringPtr(v.BodyType),
		DriveType:          nullableToStringPtr(v.DriveType),
		GearType:           nullableToStringPtr(v.GearType),
		SuspensionType:     nullableToStringPtr(v.SuspensionType),
		OwnerID:            v.OwnerID,
		BlockchainAssetID:  nullableToStringPtr(v.BlockchainAssetID),
		CID:                v.Cid,
		CIDSourceJSON:      v.CidSourceJson,
		CIDSourceCBOR:      v.CidSourceCborB64,
		CreatedAt:          v.CreatedAt,
		UpdatedAt:          v.UpdatedAt,
	}
}
