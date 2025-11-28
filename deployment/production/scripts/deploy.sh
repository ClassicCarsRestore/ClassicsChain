#!/usr/bin/env bash
set -euo pipefail

# Deployment script for ClassicsChain production environment
# This script is meant to be run on the VM after files have been transferred

DEPLOY_DIR="/opt/classicschain"

echo "Starting deployment..."

# Check if .env file exists
if [ ! -f "${DEPLOY_DIR}/.env" ]; then
    echo "Error: .env file not found at ${DEPLOY_DIR}/.env"
    echo "Please ensure the CI/CD pipeline has created the .env file"
    exit 1
fi

cd "${DEPLOY_DIR}"

# Pull latest images
echo "Pulling latest Docker images..."
docker compose pull

# Run database migrations (if needed)
echo "Running migrations..."
docker compose up -d postgres-main postgres-kratos postgres-hydra
sleep 5
docker compose up kratos-migrate hydra-migrate
docker compose stop kratos-migrate hydra-migrate

# Start all services
echo "Starting all services..."
docker compose up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Check service health
echo "Checking service health..."
docker compose ps

echo "Deployment completed successfully!"
