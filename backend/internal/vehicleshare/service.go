package vehicleshare

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"time"

	"github.com/google/uuid"
)

func GenerateShareToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{
		repo: repo,
	}
}

func (s *Service) CreateShareLink(ctx context.Context, params CreateShareLinkParams) (*ShareLink, error) {
	_, err := parseExpirsDuration(params.Duration)
	if err != nil {
		return nil, err
	}

	shareLink, err := s.repo.Create(ctx, params)
	if err != nil {
		return nil, err
	}

	return shareLink, nil
}

func (s *Service) GetSharedVehicleData(ctx context.Context, token string) (*ShareLink, error) {
	shareLink, err := s.repo.GetByToken(ctx, token)
	if err != nil {
		return nil, err
	}

	if shareLink == nil {
		return nil, ErrShareLinkNotFound
	}

	if shareLink.IsExpired() {
		return nil, ErrShareLinkExpired
	}

	if shareLink.IsRevoked() {
		return nil, ErrShareLinkRevoked
	}

	err = s.repo.IncrementAccessCount(ctx, shareLink.ID)
	if err != nil {
		return nil, err
	}

	return shareLink, nil
}

func (s *Service) RevokeShareLink(ctx context.Context, shareLinkID uuid.UUID) (*ShareLink, error) {
	return s.repo.Revoke(ctx, shareLinkID)
}

func (s *Service) ListShareLinks(ctx context.Context, vehicleID uuid.UUID) ([]ShareLink, error) {
	return s.repo.ListByVehicle(ctx, vehicleID)
}

func parseExpirsDuration(duration string) (time.Time, error) {
	now := time.Now()
	switch duration {
	case "1h":
		return now.Add(1 * time.Hour), nil
	case "24h":
		return now.Add(24 * time.Hour), nil
	case "7d":
		return now.Add(7 * 24 * time.Hour), nil
	case "30d":
		return now.Add(30 * 24 * time.Hour), nil
	default:
		return time.Time{}, ErrInvalidDuration
	}
}
