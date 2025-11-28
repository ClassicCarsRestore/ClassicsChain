#!/usr/bin/env bash
set -euo pipefail

# This script renders configuration templates with environment variables
# It should be run during CI/CD with all secrets loaded

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIGS_DIR="${DEPLOY_DIR}/configs"

echo "Rendering configuration templates..."

# Check if envsubst is available
if ! command -v envsubst &> /dev/null; then
    echo "Error: envsubst is not installed. Please install gettext package."
    exit 1
fi

# Render Kratos config
echo "Rendering kratos.yaml..."
envsubst < "${CONFIGS_DIR}/kratos.yaml.template" > "${CONFIGS_DIR}/kratos/kratos.yaml"

# Render Garage config
echo "Rendering garage.toml..."
envsubst < "${CONFIGS_DIR}/garage.toml.template" > "${CONFIGS_DIR}/garage.toml"

# Render Caddyfile
echo "Rendering Caddyfile..."
envsubst < "${CONFIGS_DIR}/Caddyfile.template" > "${CONFIGS_DIR}/Caddyfile"

echo "Configuration files rendered successfully!"
