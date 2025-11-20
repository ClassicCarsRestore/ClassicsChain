package repository

import (
	"context"

	"github.com/google/uuid"

	"github.com/s1moe2/classics-chain/pkg/postgres"
	"github.com/s1moe2/classics-chain/pkg/postgres/db"
	"github.com/s1moe2/classics-chain/user"
)

type UserRepository struct {
	queries db.Querier
}

func NewUserRepository(queries db.Querier) *UserRepository {
	return &UserRepository{queries: queries}
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*user.User, error) {
	u, err := r.queries.GetUserByID(ctx, id)
	if err != nil {
		if postgres.IsNotFoundError(err) {
			return nil, user.ErrUserNotFound
		}
		return nil, postgres.WrapError(err, "get user by id")
	}

	result := toUserDomain(u)
	return &result, nil
}

func (r *UserRepository) Create(ctx context.Context, usr *user.User) error {
	created, err := r.queries.CreateUser(ctx, db.CreateUserParams{
		ID:      usr.ID,
		IsAdmin: usr.IsAdmin,
	})
	if err != nil {
		return postgres.WrapError(err, "create user")
	}

	*usr = toUserDomain(created)
	return nil
}

func (r *UserRepository) GetUserEntityMemberships(ctx context.Context, userID uuid.UUID) ([]user.EntityMembership, error) {
	memberships, err := r.queries.GetUserEntityMemberships(ctx, userID)
	if err != nil {
		return nil, postgres.WrapError(err, "get user entity memberships")
	}

	result := make([]user.EntityMembership, len(memberships))
	for i, m := range memberships {
		result[i] = toEntityMembershipDomain(m)
	}

	return result, nil
}

func (r *UserRepository) GetEntityMembers(ctx context.Context, entityID uuid.UUID) ([]user.EntityMembership, error) {
	members, err := r.queries.GetEntityMembers(ctx, entityID)
	if err != nil {
		return nil, postgres.WrapError(err, "get entity members")
	}

	result := make([]user.EntityMembership, len(members))
	for i, m := range members {
		result[i] = user.EntityMembership{
			UserID:   m.UserID,
			EntityID: m.EntityID,
			Role:     m.Role,
		}
	}

	return result, nil
}

func (r *UserRepository) AddUserToEntity(ctx context.Context, userID, entityID uuid.UUID, role string) error {
	_, err := r.queries.AddUserToEntity(ctx, db.AddUserToEntityParams{
		UserID:   userID,
		EntityID: entityID,
		Role:     role,
	})
	return postgres.WrapError(err, "add user to entity")
}

func (r *UserRepository) RemoveUserFromEntity(ctx context.Context, userID, entityID uuid.UUID) error {
	return postgres.WrapError(r.queries.RemoveUserFromEntity(ctx, db.RemoveUserFromEntityParams{
		UserID:   userID,
		EntityID: entityID,
	}), "remove user from entity")
}

func (r *UserRepository) UpdateUserEntityRole(ctx context.Context, userID, entityID uuid.UUID, role string) error {
	_, err := r.queries.UpdateUserEntityRole(ctx, db.UpdateUserEntityRoleParams{
		UserID:   userID,
		EntityID: entityID,
		Role:     role,
	})
	return postgres.WrapError(err, "update user entity role")
}

func (r *UserRepository) GetUserEntityRole(ctx context.Context, userID, entityID uuid.UUID) (string, error) {
	role, err := r.queries.GetUserEntityRole(ctx, db.GetUserEntityRoleParams{
		UserID:   userID,
		EntityID: entityID,
	})
	if err != nil {
		return "", postgres.WrapError(err, "get user entity role")
	}
	return role, nil
}

func (r *UserRepository) CheckUserEntityMembership(ctx context.Context, userID, entityID uuid.UUID) (bool, error) {
	isMember, err := r.queries.CheckUserEntityMembership(ctx, db.CheckUserEntityMembershipParams{
		UserID:   userID,
		EntityID: entityID,
	})
	if err != nil {
		return false, postgres.WrapError(err, "check user entity membership")
	}
	return isMember, nil
}

// toUserDomain converts a database user to domain model
func toUserDomain(u db.User) user.User {
	return user.User{
		ID:        u.ID,
		IsAdmin:   u.IsAdmin,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

// toEntityMembershipDomain converts a database entity membership to domain model
func toEntityMembershipDomain(m db.GetUserEntityMembershipsRow) user.EntityMembership {
	return user.EntityMembership{
		UserID:     m.UserID,
		EntityID:   m.EntityID,
		Role:       m.Role,
		EntityName: &m.EntityName,
		EntityType: &m.EntityType,
	}
}
