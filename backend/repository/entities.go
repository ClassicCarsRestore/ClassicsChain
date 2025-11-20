package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"

	"github.com/s1moe2/classics-chain/entity"
	"github.com/s1moe2/classics-chain/pkg/postgres"
	"github.com/s1moe2/classics-chain/pkg/postgres/db"
)

type EntityRepository struct {
	queries db.Querier
}

func NewEntityRepository(queries db.Querier) *EntityRepository {
	return &EntityRepository{queries: queries}
}

func (r *EntityRepository) GetAll(ctx context.Context, limit, offset int, entityType *entity.EntityType) ([]entity.Entity, int, error) {
	var entities []db.Entity
	var err error
	var total int64

	if entityType != nil {
		entities, err = r.queries.ListEntitiesByType(ctx, db.ListEntitiesByTypeParams{
			EntityType: string(*entityType),
			Limit:      int32(limit),
			Offset:     int32(offset),
		})
		if err != nil {
			return nil, 0, postgres.WrapError(err, "list entities by type")
		}
		total, err = r.queries.CountEntitiesByType(ctx, string(*entityType))
		if err != nil {
			return nil, 0, postgres.WrapError(err, "count entities by type")
		}
	} else {
		entities, err = r.queries.ListEntities(ctx, db.ListEntitiesParams{
			Limit:  int32(limit),
			Offset: int32(offset),
		})
		if err != nil {
			return nil, 0, postgres.WrapError(err, "list entities")
		}
		total, err = r.queries.CountEntities(ctx)
		if err != nil {
			return nil, 0, postgres.WrapError(err, "count entities")
		}
	}

	result := make([]entity.Entity, len(entities))
	for i, e := range entities {
		result[i] = toEntityDomain(e)
	}

	return result, int(total), nil
}

func (r *EntityRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Entity, error) {
	e, err := r.queries.GetEntity(ctx, id)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, entity.ErrEntityNotFound
		}
		return nil, postgres.WrapError(err, "get entity")
	}

	result := toEntityDomain(e)
	return &result, nil
}

func (r *EntityRepository) Create(ctx context.Context, ent *entity.Entity) error {
	addressJSON, err := json.Marshal(ent.Address)
	if err != nil {
		return fmt.Errorf("marshal address: %w", err)
	}

	created, err := r.queries.CreateEntity(ctx, db.CreateEntityParams{
		Name:         ent.Name,
		EntityType:   string(ent.Type),
		Description:  stringToNullable(ent.Description),
		ContactEmail: ent.ContactEmail,
		Website:      stringToNullable(ent.Website),
		Address:      addressJSON,
		CertifiedBy:  ent.CertifiedBy,
	})
	if err != nil {
		return postgres.WrapError(err, "create entity")
	}

	*ent = toEntityDomain(created)
	return nil
}

func (r *EntityRepository) Update(ctx context.Context, ent *entity.Entity) error {
	addressJSON, err := json.Marshal(ent.Address)
	if err != nil {
		return fmt.Errorf("marshal address: %w", err)
	}

	updated, err := r.queries.UpdateEntity(ctx, db.UpdateEntityParams{
		ID:           ent.ID,
		Name:         ent.Name,
		Description:  stringToNullable(ent.Description),
		ContactEmail: ent.ContactEmail,
		Website:      stringToNullable(ent.Website),
		Address:      addressJSON,
	})
	if err != nil {
		return postgres.WrapError(err, "update entity")
	}

	*ent = toEntityDomain(updated)
	return nil
}

func (r *EntityRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return postgres.WrapError(r.queries.DeleteEntity(ctx, id), "delete entity")
}

func toEntityDomain(e db.Entity) entity.Entity {
	var addr *entity.Address
	if len(e.Address) > 0 {
		var a entity.Address
		json.Unmarshal(e.Address, &a)
		addr = &a
	}

	return entity.Entity{
		ID:           e.ID,
		Name:         e.Name,
		Type:         entity.EntityType(e.EntityType),
		Description:  nullableToStringPtr(e.Description),
		ContactEmail: e.ContactEmail,
		Website:      nullableToStringPtr(e.Website),
		Address:      addr,
		CertifiedBy:  e.CertifiedBy,
		CreatedAt:    e.CreatedAt,
		UpdatedAt:    e.UpdatedAt,
	}
}
