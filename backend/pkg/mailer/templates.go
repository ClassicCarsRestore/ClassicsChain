package mailer

import (
	"fmt"

	"github.com/s1moe2/classics-chain/invitation"
)

func RenderAdminInvitationTemplate(name, invitationURL string) string {
	displayName := name
	if displayName == "" {
		displayName = "there"
	}

	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { margin: 20px 0; }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #ccc;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            margin: 20px 0;
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to Classics Chain!</h2>
            <p>You've been invited to join as an Administrator</p>
        </div>

        <div class="content">
            <p>Hi %s,</p>
            <p>You've been invited to join Classics Chain as an administrator. You'll have full access to manage the platform, users, and entities.</p>
            <p>Click the button below to complete your signup and set your password:</p>
            <a href="%s" class="button">Accept Invitation</a>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:<br>%s</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">This invitation expires in 7 days.</p>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; Classics Chain. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, displayName, invitationURL, invitationURL)
}

func RenderEntityMemberInvitationTemplate(name, entityName, role, invitationURL string) string {
	displayName := name
	if displayName == "" {
		displayName = "there"
	}

	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { margin: 20px 0; }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #ccc;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            margin: 20px 0;
        }
        .entity-info {
            background-color: #e8f4f8;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to Classics Chain!</h2>
            <p>You've been invited to join %s</p>
        </div>

        <div class="content">
            <p>Hi %s,</p>
            <p>You've been invited to join Classics Chain and become part of the following entity:</p>

            <div class="entity-info">
                <strong>Entity:</strong> %s<br>
                <strong>Your Role:</strong> %s
            </div>

            <p>Click the button below to complete your signup and set your password:</p>
            <a href="%s" class="button">Accept Invitation</a>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:<br>%s</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">This invitation expires in 7 days.</p>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; Classics Chain. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, entityName, displayName, entityName, role, invitationURL, invitationURL)
}

func RenderOwnerInvitationTemplate(email, invitationURL string, vehicles []invitation.VehicleInfo) string {
	vehicleCount := len(vehicles)
	vehiclesWord := "vehicle"
	if vehicleCount > 1 {
		vehiclesWord = "vehicles"
	}

	vehicleListHTML := ""
	for _, v := range vehicles {
		vehicleDesc := ""
		if v.Year > 0 && v.Make != "" && v.Model != "" {
			vehicleDesc = fmt.Sprintf("%d %s %s", v.Year, v.Make, v.Model)
		} else if v.Make != "" && v.Model != "" {
			vehicleDesc = fmt.Sprintf("%s %s", v.Make, v.Model)
		} else {
			vehicleDesc = "Classic Vehicle"
		}

		plateInfo := ""
		if v.LicensePlate != "" {
			plateInfo = fmt.Sprintf(" (License Plate: %s)", v.LicensePlate)
		}

		vehicleListHTML += fmt.Sprintf(`
            <div class="vehicle-item">
                <strong>•</strong> %s%s
            </div>
        `, vehicleDesc, plateInfo)
	}

	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { margin: 20px 0; }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #ccc;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            margin: 20px 0;
        }
        .vehicle-list {
            background-color: #e8f4f8;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }
        .vehicle-item {
            margin: 8px 0;
            padding: 8px 0;
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to Classics Chain!</h2>
            <p>You've been invited to manage your classic %s</p>
        </div>

        <div class="content">
            <p>Hi there,</p>
            <p>You've been invited to join Classics Chain to manage the following %s:</p>

            <div class="vehicle-list">
                %s
            </div>

            <p>Create your account to start tracking your vehicle's history, certificates, and events on the blockchain.</p>

            <p style="text-align: center;">
                <a href="%s" class="button">Create Your Account</a>
            </p>

            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:<br>
            <a href="%s" style="color: #2563eb; word-break: break-all;">%s</a></p>

            <p style="color: #999; font-size: 12px; margin-top: 20px;">This invitation expires in 7 days.</p>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; Classics Chain. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, vehiclesWord, vehiclesWord, vehicleListHTML, invitationURL, invitationURL, invitationURL)
}
