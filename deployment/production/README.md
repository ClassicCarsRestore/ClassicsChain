# ClassicsChain Production Deployment

This directory contains the production deployment configuration for ClassicsChain, designed to deploy the full stack to a remote VM via GitHub Actions with proper secrets management.

## Stack Components

- **Postgres (3 containers)**: Separate database containers for main app, Kratos, and Hydra
  - postgres-main: Main application database
  - postgres-kratos: Kratos identity database
  - postgres-hydra: Hydra OAuth2 database
- **Kratos**: Identity and user management
- **Hydra**: OAuth2 and OpenID Connect server
- **Garage**: S3-compatible object storage
- **Backend**: Go HTTP API server
- **Caddy**: Reverse proxy and web server with automatic HTTPS

## Directory Structure

```
deployment/production/
├── configs/
│   ├── kratos/
│   │   ├── identity.schema.json
│   │   ├── courier-templates/
│   │   └── kratos.yaml.template
│   ├── garage.toml.template
│   └── Caddyfile.template
├── scripts/
│   ├── render-configs.sh
│   └── deploy.sh
├── docker-compose.yml
├── .env.example
└── README.md
```

## VM Setup

### Prerequisites

1. Docker and Docker Compose installed on the VM
2. SSH access configured
3. Directory structure created at `/opt/classicschain/`

### Initial Setup on VM

```bash
# Create deployment directory
sudo mkdir -p /opt/classicschain
sudo chown $USER:$USER /opt/classicschain

# Create directories for static files
mkdir -p /opt/classicschain/web
mkdir -p /opt/classicschain/admin
```

## GitHub Secrets Configuration

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### SSH Configuration
- `DEPLOY_SSH_KEY`: Private SSH key for deployment
- `DEPLOY_HOST`: VM hostname or IP address
- `DEPLOY_USER`: SSH username

### PostgreSQL

Each service has its own dedicated PostgreSQL container with separate credentials:

**Main Application Database:**
- `POSTGRES_MAIN_USER`: Database user (e.g., ccpg_main)
- `POSTGRES_MAIN_PASSWORD`: Strong password
- `POSTGRES_MAIN_DB`: Main database name (e.g., classics_chain)

**Kratos Database:**
- `POSTGRES_KRATOS_USER`: Database user (e.g., ccpg_kratos)
- `POSTGRES_KRATOS_PASSWORD`: Strong password
- `POSTGRES_KRATOS_DB`: Kratos database name (e.g., kratos)

**Hydra Database:**
- `POSTGRES_HYDRA_USER`: Database user (e.g., ccpg_hydra)
- `POSTGRES_HYDRA_PASSWORD`: Strong password
- `POSTGRES_HYDRA_DB`: Hydra database name (e.g., hydra)

Generate strong passwords:
```bash
# Generate strong password for each database
openssl rand -base64 32
```

### Kratos
- `KRATOS_PUBLIC_BASE_URL`: Public URL (e.g., https://auth.classicschain.com)
- `KRATOS_LOG_LEVEL`: Log level (info, debug, warn, error)
- `KRATOS_TOTP_ISSUER`: TOTP issuer name (e.g., ClassicsChain)
- `KRATOS_SECRET_COOKIE`: 32-character random string
- `KRATOS_SECRET_CIPHER`: 32-character random string
- `KRATOS_SMTP_CONNECTION_URI`: SMTP connection string

### Hydra
- `HYDRA_PUBLIC_URL`: Public URL (e.g., https://oauth.classicschain.com)
- `HYDRA_ADMIN_URL`: Admin URL (usually http://hydra:4445)
- `HYDRA_LOG_LEVEL`: Log level (info, debug, warn, error)
- `HYDRA_SECRETS_SYSTEM`: 32-character random string

### Garage (S3 Storage)
- `GARAGE_RPC_SECRET`: 64-character hex string
- `GARAGE_REGION`: S3 region name (e.g., garage)
- `GARAGE_ROOT_DOMAIN`: Root domain (e.g., classicschain.com)
- `GARAGE_ADMIN_TOKEN`: Long random string
- `GARAGE_METRICS_TOKEN`: Long random string
- `GARAGE_ACCESS_KEY`: S3 access key
- `GARAGE_SECRET_KEY`: S3 secret key
- `GARAGE_BUCKET`: Bucket name (e.g., vehicle-photos)

Generate secrets:
```bash
# RPC secret (64 hex chars)
openssl rand -hex 32

# Admin and metrics tokens
openssl rand -base64 32

# Access and secret keys
openssl rand -base64 20
```

### Backend
- `BACKEND_IMAGE`: Docker image path (e.g., ghcr.io/username/classicschain/backend)
- `BACKEND_IMAGE_TAG`: Image tag (e.g., latest, main-abc123)

### Domains
- `DOMAIN`: Main domain (e.g., classicschain.com)
- `ADMIN_DOMAIN`: Admin domain (e.g., admin.classicschain.com)
- `API_DOMAIN`: API domain (e.g., api.classicschain.com)
- `AUTH_DOMAIN`: Auth domain (e.g., auth.classicschain.com)
- `STORAGE_DOMAIN`: Storage domain (e.g., storage.classicschain.com)
- `WEB_APP_URL`: Full web app URL (e.g., https://classicschain.com)
- `ADMIN_APP_URL`: Full admin app URL (e.g., https://admin.classicschain.com)

### Paths
- `WEB_APP_PATH`: Path to web app on VM (e.g., /opt/classicschain/web)
- `ADMIN_APP_PATH`: Path to admin app on VM (e.g., /opt/classicschain/admin)

### Other
- `ADMIN_EMAIL`: Admin email for Let's Encrypt (e.g., admin@classicschain.com)

## Deployment Workflow

The deployment happens in these steps:

1. **Render Templates**: Configuration templates are rendered with secrets from GitHub Secrets
2. **SSH Setup**: SSH connection to VM is configured
3. **Create .env**: Environment file is created on VM with all secrets
4. **Transfer Files**: Rendered configs, docker-compose.yml, and scripts are transferred
5. **Deploy**: Deployment script runs on VM to start/update services

### Triggering Deployment

The workflow can be triggered:
- Manually via GitHub Actions UI
- Automatically on push to `main` when deployment files change

## Local Testing

To test the deployment locally:

1. Copy `.env.example` to `.env` and fill in values:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. Render configs:
   ```bash
   ./scripts/render-configs.sh
   ```

3. Start services:
   ```bash
   docker compose up -d
   ```

## Initial Garage Setup

After first deployment, initialize Garage:

```bash
# SSH to VM
cd /opt/classicschain

# Create a cluster
docker compose exec garage garage layout assign $(docker compose exec garage garage status | grep UNCONFIGURED | awk '{print $1}')
docker compose exec garage garage layout apply --version 1

# Create a key
docker compose exec garage garage key create classics-key

# Create a bucket
docker compose exec garage garage bucket create vehicle-photos

# Allow key to access bucket
docker compose exec garage garage bucket allow --read --write vehicle-photos --key classics-key

# Get credentials (use these as GARAGE_ACCESS_KEY and GARAGE_SECRET_KEY)
docker compose exec garage garage key info classics-key
```

## Monitoring

Check service status:
```bash
cd /opt/classicschain
docker compose ps
docker compose logs -f [service_name]
```

## Security Considerations

1. **Never commit secrets** - All secrets are managed via GitHub Secrets
2. **Rendered configs are gitignored** - Only templates are committed
3. **SSH key security** - Ensure deployment SSH key has minimal permissions
4. **Database backups** - Set up regular backups of all three Postgres volumes (postgres_main_data, postgres_kratos_data, postgres_hydra_data)
5. **Separate database isolation** - Each service has its own database container with unique credentials for better security isolation
6. **SSL certificates** - Caddy automatically handles Let's Encrypt certificates
7. **Firewall** - Configure VM firewall to only allow necessary ports (80, 443, 22)

## Troubleshooting

### Services won't start
```bash
# Check logs
docker compose logs [service_name]

# Check .env file
cat .env

# Restart services
docker compose restart [service_name]
```

### Database migration failures
```bash
# Check migration logs
docker compose logs kratos-migrate
docker compose logs hydra-migrate

# Manual migration
docker compose up kratos-migrate
```

### Config issues
```bash
# Verify rendered configs
cat configs/kratos/kratos.yaml
cat configs/garage.toml
cat configs/Caddyfile
```
