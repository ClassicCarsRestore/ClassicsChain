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

## Performance Benchmarks

The `benchmark/` directory contains a k6-based performance evaluation suite.

### Prerequisites

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) installed
- Local dev environment running (`cd deployment/local && docker compose up -d`)
- Algorand network running (`algokit localnet start`)
- Backend running (`cd backend && go run ./cmd/http/main.go`)
- Docker (for report generation only)

### Quick Start

```bash
cd benchmark
make setup              # Verify k6, create results directory
make run-baseline       # Run all baseline latency tests
make report             # Generate CSV tables + charts (runs in Docker)
```

### Test Design Rationale

The benchmark suite targets the three operations that define the system's core data path: reading vehicle records, writing vehicle records, and creating blockchain-anchored events. These were chosen because they exercise fundamentally different layers of the architecture and represent the operations users and certified entities perform most frequently.

**Baseline tests** isolate each operation under a controlled, steady load (constant arrival rate, 60 seconds) to establish per-endpoint latency profiles without interference from concurrency effects.

| Test | Target | Why |
|------|--------|-----|
| `read-vehicles` | `GET /v1/vehicles` | Measures the read path: session auth, PostgreSQL query with pagination, JSON serialization. Represents the most common user operation (browsing vehicle records). Seeds 50 vehicles beforehand so the query hits realistic data volumes. |
| `write-vehicle` | `POST /v1/certifiers/vehicles` | Measures the write path without blockchain: OAuth2 auth, input validation, DB insert. Establishes a baseline for write latency before blockchain costs are added. Uses the certifier endpoint since that is how vehicles enter the system in production (certified entities register vehicles, not owners). |
| `write-event-anchored` | `POST /v1/events` | Measures the full write-through-blockchain path: OAuth2 auth, DB insert, CID generation, Algorand transaction, and DB update with the transaction ID. This is the most expensive operation in the system and the one most sensitive to external latency (Algorand network round-trip). The rate is intentionally lower (2 req/s vs 10) to accommodate the ~4.5s blockchain latency per transaction. |

**Scaling tests** answer a different question: how does the system behave when multiple users interact simultaneously?

| Test | Target | Why |
|------|--------|-----|
| `ramp-mixed` | 80% reads / 20% writes | Simulates realistic concurrent usage. Ramps from 1 to 100 VUs over 30s, holds for 1 minute, then ramps down. The 80/20 read/write ratio reflects the expected access pattern — most users browse or verify records, while certified entities create new entries less frequently. Mixes list, get, public passport (reads) with vehicle creation and event creation (writes). |
| `spike` | Read-only burst to 500 VUs | Tests system resilience under sudden extreme load — 500 concurrent users hitting the read path. This simulates scenarios like a public event or media mention driving traffic to the passport verification page. Uses read-only operations since spike traffic in a registry system is overwhelmingly reads. Measures whether the system degrades gracefully (higher latency but no errors) rather than failing catastrophically. |

### Test Categories

| Category | Command | Tests |
|----------|---------|-------|
| **Baseline** | `make run-baseline` | read-vehicles, write-vehicle, write-event-anchored |
| **Scaling** | `make run-scaling` | ramp-mixed, spike |
| **All** | `make run-all` | Baseline + scaling sequentially |

Individual tests can also be run, e.g. `make run-baseline-write-vehicle` or `make run-scaling-spike`.

### Running Against a Remote Environment

Instead of the local Kratos/Hydra admin flow, provide pre-configured tokens:

```bash
export BASE_URL=https://...
export SESSION_TOKEN=ory_st_...     # From Kratos login
export OAUTH2_TOKEN=ory_at_...      # From Hydra client_credentials grant
export ENTITY_ID=<uuid>             # Certifier entity ID
make run-baseline
```

### Test Methodology (for thesis)

For reproducible results, each test configuration should be run **3 independent times** with a clean environment between runs:

```bash
# 1. Clean environment
cd ../deployment/local && docker compose down -v && docker compose up -d
# Wait for services to be healthy

# 2. Start backend (handles DB migration + admin seed)
cd ../../backend && go run ./cmd/http/main.go

# 3. Run test (k6 setup() seeds test data automatically)
cd ../benchmark && make run-baseline-read-vehicles

# Repeat 1-3 two more times, then aggregate median + stddev across runs
```

Results are written to `benchmark/results/` as JSON files (gitignored). Reports go to `benchmark/results/report_YYYYMMDD/`.