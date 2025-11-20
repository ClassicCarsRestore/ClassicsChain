package http

import (
	"context"

	"github.com/s1moe2/classics-chain/auth"
	"github.com/s1moe2/classics-chain/vehicles"
)

// Authorization resource names
const (
	ResourceAdminUsers  = "admin_users"
	ResourceVehicles    = "vehicles"
	ResourceEvents      = "events"
	ResourceOwnerEvents = "owner_events"
	ResourceEntities    = "entities"
	ResourceCertifiers  = "certifiers"
	ResourcePartners    = "partners"
)

// Authorization action names
const (
	ActionCreate = "create"
	ActionRead   = "read"
	ActionUpdate = "update"
	ActionDelete = "delete"
)

// Entity role names
const (
	EntityRoleAdmin  = "admin"
	EntityRoleMember = "member"
)

func isVehicleOwner(ctx context.Context, vehicle *vehicles.Vehicle) bool {
	currentUserID, ok := auth.GetIdentityID(ctx)
	if !ok {
		return false
	}

	return vehicle.OwnerID != nil && *vehicle.OwnerID == currentUserID
}
