package vehicleshare

import "errors"

var (
	ErrShareLinkExpired             = errors.New("share link has expired")
	ErrShareLinkRevoked             = errors.New("share link has been revoked")
	ErrShareLinkNotFound            = errors.New("share link not found")
	ErrInsufficientSharePermissions = errors.New("insufficient permissions to access this data")
	ErrInvalidDuration              = errors.New("invalid share link duration")
)
