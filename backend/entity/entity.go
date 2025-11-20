package entity

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrEntityNotFound = errors.New("entity not found")
)

// Entity represents a certifier or partner in the system
type Entity struct {
	ID           uuid.UUID  `json:"id"`
	Name         string     `json:"name"`
	Type         EntityType `json:"type"`
	Description  *string    `json:"description,omitempty"`
	ContactEmail string     `json:"contactEmail"`
	Website      *string    `json:"website,omitempty"`
	Address      *Address   `json:"address,omitempty"`
	CertifiedBy  *uuid.UUID `json:"certifiedBy,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

// EntityType represents the type of entity
type EntityType string

const (
	TypeCertifier EntityType = "certifier"
	TypePartner   EntityType = "partner"
)

// Address represents a physical address
type Address struct {
	Street     *string `json:"street,omitempty"`
	City       string  `json:"city"`
	State      *string `json:"state,omitempty"`
	PostalCode *string `json:"postalCode,omitempty"`
	Country    string  `json:"country"`
}

// CreateEntityParams represents parameters for creating a new entity
type CreateEntityParams struct {
	Name         string
	Type         EntityType
	Description  *string
	ContactEmail string
	Website      *string
	Address      *Address
	CertifiedBy  *uuid.UUID // ID of the certifier entity or admin that vouched for this entity
}

// UpdateEntityParams represents parameters for updating an existing entity
type UpdateEntityParams struct {
	Name         *string
	Description  *string
	ContactEmail *string
	Website      *string
	Address      *Address
}
