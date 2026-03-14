package mailer

import (
	"context"
	"fmt"

	"github.com/ClassicCarsRestore/ClassicsChain/invitation"
	"github.com/resend/resend-go/v3"
)

type Config struct {
	APIKey     string
	FromEmail  string
	FromName   string
	BaseURL    string // Admin app URL (for admin/entity invitations)
	WebBaseURL string // Web app URL (for owner invitations)
}

type Mailer struct {
	client *resend.Client
	config Config
}

func New(config Config) *Mailer {
	client := resend.NewClient(config.APIKey)
	return &Mailer{
		client: client,
		config: config,
	}
}

func (m *Mailer) SendAdminInvitation(ctx context.Context, to, name, token string) error {
	invitationURL := fmt.Sprintf("%s/invite/%s", m.config.BaseURL, token)

	subject := "You've been invited to Classics Chain as an Admin"
	htmlBody := RenderAdminInvitationTemplate(name, invitationURL)

	params := &resend.SendEmailRequest{
		From:    fmt.Sprintf("%s <%s>", m.config.FromName, m.config.FromEmail),
		To:      []string{to},
		Subject: subject,
		Html:    htmlBody,
	}

	_, err := m.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("send admin invitation email: %w", err)
	}

	return nil
}

func (m *Mailer) SendEntityMemberInvitation(ctx context.Context, to, name, token, entityName, role string) error {
	invitationURL := fmt.Sprintf("%s/invite/%s", m.config.BaseURL, token)

	subject := fmt.Sprintf("You've been invited to %s on Classics Chain", entityName)
	htmlBody := RenderEntityMemberInvitationTemplate(name, entityName, role, invitationURL)

	params := &resend.SendEmailRequest{
		From:    fmt.Sprintf("%s <%s>", m.config.FromName, m.config.FromEmail),
		To:      []string{to},
		Subject: subject,
		Html:    htmlBody,
	}

	_, err := m.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("send entity member invitation email: %w", err)
	}

	return nil
}

func (m *Mailer) SendOwnerInvitation(ctx context.Context, to, token string, vehicles []invitation.VehicleInfo) error {
	baseURL := m.config.WebBaseURL
	if baseURL == "" {
		baseURL = m.config.BaseURL
	}
	invitationURL := fmt.Sprintf("%s/invitation?invitation=%s", baseURL, token)

	vehicleCount := len(vehicles)
	vehiclesWord := "vehicle"
	if vehicleCount > 1 {
		vehiclesWord = "vehicles"
	}

	subject := fmt.Sprintf("You've been invited to manage %d %s on Classics Chain", vehicleCount, vehiclesWord)
	htmlBody := RenderOwnerInvitationTemplate(to, invitationURL, vehicles)

	params := &resend.SendEmailRequest{
		From:    fmt.Sprintf("%s <%s>", m.config.FromName, m.config.FromEmail),
		To:      []string{to},
		Subject: subject,
		Html:    htmlBody,
	}

	_, err := m.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("send owner invitation email: %w", err)
	}

	return nil
}
