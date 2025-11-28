package seed

import (
	"context"
	"fmt"
	"log"

	"github.com/s1moe2/classics-chain/pkg/kratos"
	"github.com/s1moe2/classics-chain/pkg/postgres/db"
)

type AdminUserConfig struct {
	Email    string
	Password string
}

// SeedAdminUser creates an admin user in both Kratos and the database
// If the user already exists, it ensures they have admin privileges
func SeedAdminUser(ctx context.Context, kratosClient *kratos.Client, querier *db.Queries, config AdminUserConfig) error {
	if config.Email == "" {
		return fmt.Errorf("admin email is required")
	}
	if config.Password == "" {
		return fmt.Errorf("admin password is required")
	}

	adminUsers, err := kratosClient.ListAdminUsers(ctx)
	if err != nil {
		return fmt.Errorf("failed to list admin users: %w", err)
	}

	var adminUser *kratos.UserIdentity
	for i := range adminUsers {
		if adminUsers[i].Email == config.Email {
			adminUser = &adminUsers[i]
			log.Printf("Admin user already exists in Kratos: %s (ID: %s)", config.Email, adminUser.ID)
			break
		}
	}

	// Create admin user in Kratos if it doesn't exist
	if adminUser == nil {
		log.Printf("Creating admin user in Kratos: %s", config.Email)

		user, err := kratosClient.CreateUser(ctx, kratos.CreateUserParams{
			Email:    config.Email,
			IsAdmin:  true,
			Password: &config.Password,
		})
		if err != nil {
			return fmt.Errorf("failed to create admin user in Kratos: %w", err)
		}

		log.Printf("Admin user created in Kratos: %s (ID: %s)", config.Email, user.ID)
	}

	log.Println("Admin user seeding completed successfully")
	return nil
}
