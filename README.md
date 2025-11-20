## Classics Chain

This project aims to develop a **Blockchain-Powered Ecosystem for Classic Vehicle History Preservation**, transforming the traditional, static certifications into a dynamic, continuously enriched historical passport. The core challenge is to balance the need for **data privacy and controlled access** (for sensitive vehicle and owner data) with **global transparency, immutability, and auditable integrity** (for the certification status and historical record).

The proposed solution utilizes a **hybrid architecture** combining a private, permissioned application layer with a public blockchain (Algorand) for cryptographic anchoring.


## Development

All dependencies are managed with Docker Compose. To start the development environment, run `docker compose up -d`.
The project depends also on a local Algorand network, which can be started with Algokit (see section below).

## Algorand

Start a local net with `algokit localnet start`.
Generate a wallet with `docker exec algokit_sandbox_algod algokey generate`.
Open LORA the explorer with `algokit explore`.
Fund the new wallet in the exlporer: `https://lora.algokit.io/localnet/fund`.

### Garage

Garage setup is automated when the server starts. A `garage-init` service will:
- Configure the cluster layout
- Create an access key named "default"
- Create a "vehicles" bucket for storing vehicle documents and photos
- Configure CORS settings for the bucket

This happens automatically during `docker compose up`, so no manual setup is required.

**Manual Setup (if needed for troubleshooting):**

If you need to manually interact with Garage, execute commands as `docker exec -it cc-garage /garage [subcmd]`.

```bash
# Get node id from status output
garage status

# Prepare cluster (if not already configured)
garage layout assign -z dc1 -c 1G <node_id>
garage layout apply --version 1

# Generate access key/secret (if not already created)
garage key create <key-name>
garage key allow --create-bucket <key_id>

# Setup vehicles bucket (if not already created)
garage bucket create vehicles
garage bucket website --allow vehicles
garage bucket allow --read --write --owner vehicles --key <key-id>

# Configure CORS (if needed)
AWS_ACCESS_KEY_ID=<key_id> AWS_SECRET_ACCESS_KEY=<key_secret> aws s3api put-bucket-cors \
  --bucket vehicles --cors-configuration '{
    "CORSRules": [
      {
        "AllowedOrigins": ["http://localhost:5174"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedHeaders": ["*"],
        "MaxAgeSeconds": 3000
      }
    ]
  }' --endpoint-url http://localhost:3900
```