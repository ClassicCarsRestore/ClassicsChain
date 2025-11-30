#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="/opt/classicschain"
source "${DEPLOY_DIR}/.env"

garage_cli() {
    docker exec cc-garage garage "$@"
}

echo "Initializing Garage cluster layout..."
garage_cli layout assign -z dc1 -c 1G $(garage_cli node id | grep "^Node ID" | awk '{print $3}')
garage_cli layout apply --version 1 || echo "Layout already exists"

echo "Creating Garage access key..."
garage_cli key create "${GARAGE_ACCESS_KEY}" || echo "Key already exists"
garage_cli key import "${GARAGE_ACCESS_KEY}" "${GARAGE_SECRET_KEY}"

echo "Creating Garage bucket..."
garage_cli bucket create "${GARAGE_BUCKET}" || echo "Bucket already exists"
garage_cli bucket allow --read --write "${GARAGE_BUCKET}" --key "${GARAGE_ACCESS_KEY}"
garage_cli bucket website --allow "${GARAGE_BUCKET}"

echo "Garage initialization complete!"
