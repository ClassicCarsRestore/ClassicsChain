# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo for a blockchain-backed system for classical vehicle history preservation and authenticity verification. Uses a hybrid architecture: PostgreSQL for off-chain data, Garage (S3-compatible) for document storage, and Algorand for blockchain anchoring. Ory Kratos handles authentication, Ory Hydra handles OAuth2.

## Monorepo Structure

- **`backend/`**: Go REST API
- **`web/`**: Public-facing React frontend (Vite + TypeScript + Tailwind)
- **`admin/`**: Admin React frontend (Vite + TypeScript + Tailwind)
- **`deployment/`**: Docker Compose configs for local and production

## Development Environment

Start all dependencies:
```bash
cd deployment/local && docker compose up -d
```

Start local Algorand network:
```bash
algokit localnet start
```

### Running Services

Backend (from `backend/`):
```bash
go run ./cmd/http/main.go
```

Web frontend (from `web/`):
```bash
npm run dev  # runs on port 5174
```

Admin frontend (from `admin/`):
```bash
npm run dev  # runs on default vite port
```

## Backend Architecture

Go REST API with layered dependency injection in `backend/`:

```
cmd/http/main.go (wires dependencies)
    ↓
pkg/http/ (HTTP handlers, generated from OpenAPI)
    ↓
entity/, event/, vehicles/, photos/, documents/ etc. (business logic services)
    ↓
repository/ (data access layer using sqlc-generated code)
    ↓
pkg/postgres/db/ (sqlc-generated queries)
```

### Code Generation

From `backend/`:
```bash
go generate ./...
```

This runs:
- `oapi-codegen` to generate HTTP server code from `pkg/http/openapi.yaml`
- `sqlc` to generate Go code from SQL queries in `pkg/postgres/queries/`

### Database Migrations

From `backend/` (requires direnv or env vars from `.envrc`):
```bash
go tool tern migrate -m migrations
```

The `migrations/` directory is the single source of truth for the schema. Both tern (migration runner) and sqlc (code generation) read from it.

### Testing

From `backend/`:
```bash
go test ./...
```

## Frontend Architecture

Both `web/` and `admin/` use:
- React 19 with Vite
- Tailwind CSS 4
- React Router
- TanStack Query for data fetching
- Ory Client for authentication
- shadcn/ui components (see `components.json`)

Build (from either frontend directory):
```bash
npm run build
```

Lint:
```bash
npm run lint
```

## Key Configuration Files

- **Backend**: `backend/.envrc` (git-ignored, use direnv), `backend/tern.conf`
- **API spec**: `backend/pkg/http/openapi.yaml`
- **sqlc config**: `backend/pkg/postgres/sqlc.yaml`
- **Casbin RBAC**: `backend/casbin_model.conf`, `backend/casbin_policy.csv`
- **Kratos config**: `deployment/local/kratos/`

## Coding Guidelines

- Single-line commit messages without co-authoring
- Avoid excessive comments when code is self-explanatory
