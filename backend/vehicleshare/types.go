package vehicleshare

import (
	"time"

	"github.com/google/uuid"
)

type ShareLink struct {
	ID               uuid.UUID
	VehicleID        uuid.UUID
	Token            string
	CanViewDetails   bool
	CanViewPhotos    bool
	CanViewDocuments bool
	CanViewHistory   bool
	RecipientEmail   *string
	ExpiresAt        time.Time
	CreatedAt        time.Time
	AccessedCount    int
	LastAccessedAt   *time.Time
	RevokedAt        *time.Time
}

type CreateShareLinkParams struct {
	VehicleID        uuid.UUID
	CanViewDetails   bool
	CanViewPhotos    bool
	CanViewDocuments bool
	CanViewHistory   bool
	RecipientEmail   *string
	Duration         string // "1h", "24h", "7d", "30d"
}

type SharePermissions struct {
	CanViewDetails   bool `json:"canViewDetails"`
	CanViewPhotos    bool `json:"canViewPhotos"`
	CanViewDocuments bool `json:"canViewDocuments"`
	CanViewHistory   bool `json:"canViewHistory"`
}

func (sl *ShareLink) GetPermissions() SharePermissions {
	return SharePermissions{
		CanViewDetails:   sl.CanViewDetails,
		CanViewPhotos:    sl.CanViewPhotos,
		CanViewDocuments: sl.CanViewDocuments,
		CanViewHistory:   sl.CanViewHistory,
	}
}

func (sl *ShareLink) IsExpired() bool {
	return time.Now().After(sl.ExpiresAt)
}

func (sl *ShareLink) IsRevoked() bool {
	return sl.RevokedAt != nil
}

func (sl *ShareLink) IsActive() bool {
	return !sl.IsExpired() && !sl.IsRevoked()
}
