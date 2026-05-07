# Kapacitet

Kapacitet is a capacity coordination platform for verified companies. It allows one company to publish workforce demand, another company to publish available capacity, and the platform to generate anonymized matches that become visible only after both sides confirm.

This repository contains the full application stack, including the web frontend, backend API, local infrastructure, identity configuration, and helper scripts for local setup.

## Contents

- [Product overview](#product-overview)
- [Core capabilities](#core-capabilities)
- [Technology stack](#technology-stack)
- [Solution architecture](#solution-architecture)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Local URLs](#local-urls)
- [Seed data](#seed-data)
- [Running outside Docker](#running-outside-docker)
- [Verification](#verification)
- [Operational notes](#operational-notes)
- [Troubleshooting](#troubleshooting)

## Product overview

Kapacitet is designed for controlled capacity sharing inside a trusted business network.

The platform supports:

- company access requests and onboarding
- authenticated company users with scoped permissions
- publication of workforce demand and available capacity
- anonymized match generation between compatible demand and supply
- bilateral confirmation flows before identities are disclosed
- administrative review, company management, and audit visibility

## Core capabilities

### Access and onboarding

- Companies request access through the public entry flow.
- Platform administrators review requests before access is granted.
- Approved companies and users are provisioned through the platform and Keycloak.
- First-time password setup is handled through time-limited setup links.

### Capacity coordination

- Companies can publish capacity requests.
- Companies can publish availability declarations.
- The backend evaluates overlaps in skills, certificates, dates, geography, and quantity.
- Matches are presented as controlled offers with acceptance and confirmation steps.
- Confirmed matches can progress into active agreements.

### Administration

- Platform administrators can review access requests.
- Administrative users can inspect company records and activity.
- Audit and operational history is available through the admin workspace.

## Technology stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: ASP.NET Core Web API, Entity Framework Core
- Database: PostgreSQL 15
- Session and rate-limit store: Redis 7
- Identity and authentication: Keycloak with OpenID Connect Authorization Code Flow + PKCE
- Reverse proxy and local TLS: Caddy
- Local orchestration: Docker Compose

## Solution architecture

### High-level runtime model

- `frontend/` serves the web application and keeps authentication server-side.
- `backend/` owns business logic, application workflows, matching, onboarding, notifications, and administration.
- `postgres` stores application data.
- `redis` stores server-side sessions and distributed rate-limit state.
- `keycloak` manages user authentication, token issuance, and platform roles.
- `caddy` terminates HTTPS locally and routes traffic to the frontend and auth services.

### Authentication model

- Users authenticate through Keycloak, not directly inside the application database.
- The frontend uses a server-side session/BFF-style flow.
- Tokens are handled server-side and are not stored in browser `localStorage`.
- The backend validates JWTs against the configured Keycloak realm.

### Matching behavior

The implementation uses fixed matching rules and catalogs as part of the system’s current behavior.

Examples include:

- supported city coordinates from [MatchingCityCoordinateCatalog.cs](./backend/Kapacitet.Application/Features/Matching/Services/MatchingCityCoordinateCatalog.cs)
- weighted scoring across skills, certificates, dates, location, and quantity in [MatchEvaluationService.cs](./backend/Kapacitet.Application/Features/Matching/Services/MatchEvaluationService.cs)
- time-limited setup links in [InitialPasswordSetupService.cs](./backend/Kapacitet.Application/Features/AccountSetup/Services/InitialPasswordSetupService.cs)
- expiring generated offers in [MatchingGenerationService.cs](./backend/Kapacitet.Application/Features/Matching/Services/MatchingGenerationService.cs)
- scheduled retention cleanup in [DataRetentionService.cs](./backend/Kapacitet.Application/Features/Retention/DataRetentionService.cs)

If these rules are changed, review dependent tests, seeded data, and user-facing copy so behavior stays consistent across the system.

## Repository structure

- `frontend/`: Next.js application, UI flows, frontend API routes, authentication/session handling
- `backend/`: ASP.NET solution, API, application services, domain model, infrastructure, and automated tests
- `infrastructure/`: Docker Compose, Caddy, Keycloak realm and theme assets, and local setup scripts
- `postman/`: workspace data for API exploration

## Getting started

### Prerequisites

- Docker Desktop
- .NET SDK `9.0.308` if you want to run backend tests or services outside Docker
- Node.js `22.22.0` if you want to run the frontend outside Docker

Repository version pins:

- `.NET`: [`global.json`](./global.json)
- `Node.js`: [`.nvmrc`](./.nvmrc)

### Quick start

1. Create the local environment file.

```bash
cp infrastructure/.env.example infrastructure/.env
```

2. Set required values in `infrastructure/.env`.

Minimum required values:

- `AUTH_SESSION_SECRET`
- `OIDC_CLIENT_SECRET`

3. Start the local stack.

```bash
docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.dev.yml up --build
```

4. Trust the local Caddy certificate once on your machine.

```bash
docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.dev.yml exec caddy caddy trust
```

5. Seed local login accounts after a fresh Keycloak import.

```bash
./infrastructure/scripts/seed-keycloak-dev-users.sh
```

6. Open the application at `https://localhost`.

## Configuration

### Local environment file

Use `infrastructure/.env.example` as the starting point for `infrastructure/.env`.

Common settings:

- `AUTH_SESSION_SECRET`: secret used to protect frontend auth session state
- `OIDC_CLIENT_SECRET`: OIDC client secret used by the frontend and Keycloak import
- `Email__ApiKey`: optional when local email dev mode is enabled
- `Email__FromAddress`: default sender address for onboarding email flows
- `Email__DevMode`: enables local development email behavior
- `APP_PUBLIC_URL`: public application URL, defaults to `https://localhost`
- `KEYCLOAK_PUBLIC_URL`: public Keycloak base URL, defaults to `https://localhost/auth`

### Local development defaults

The Docker setup assumes:

- PostgreSQL is available as `postgres`
- Redis is available as `redis`
- the backend is available as `backend`
- Keycloak is served publicly through Caddy under `/auth`

## Local URLs

- App: `https://localhost`
- Keycloak realm issuer: `https://localhost/auth/realms/kapacitet`
- Keycloak admin console: `https://localhost/auth/admin`
- PostgreSQL: `localhost:5432`

## Seed data

The local development seed creates a realistic initial state for the platform, including:

- multiple companies
- multiple users with different company roles
- company settings and notification preferences
- availability declarations
- capacity requests
- open matches
- at least one populated agreement/dashboard state

### Seeded accounts

After running `./infrastructure/scripts/seed-keycloak-dev-users.sh`, the local environment includes:

- `platform-admin@kapacitet.net` / `${DEV_USER_PASSWORD:-Password123}`
- `testuser@kapacitet.net` / `${DEV_USER_PASSWORD:-Password123}`
- `request.manager@kapacitet.net` / `${DEV_USER_PASSWORD:-Password123}`
- `request.viewer@kapacitet.net` / `${DEV_USER_PASSWORD:-Password123}`
- `supplier@kapacitet.net` / `${DEV_USER_PASSWORD:-Password123}`
- `supplier.manager@kapacitet.net` / `${DEV_USER_PASSWORD:-Password123}`
- `supplier.viewer@kapacitet.net` / `${DEV_USER_PASSWORD:-Password123}`
- `partner.admin@kapacitet.net` / `${DEV_USER_PASSWORD:-Password123}`
- `partner.manager@kapacitet.net` / `${DEV_USER_PASSWORD:-Password123}`
- `partner.viewer@kapacitet.net` / `${DEV_USER_PASSWORD:-Password123}`
- Keycloak admin: `admin` / `admin`

These credentials are intended for local development only.

## Running outside Docker

When running services manually instead of through Compose:

- backend uses the SDK pinned in `global.json`
- frontend uses the Node version pinned in `.nvmrc`
- frontend requires `REDIS_URL`
- frontend proxy routes require `BACKEND_API_URL`
- frontend auth routes require:
  - `APP_PUBLIC_URL`
  - `OIDC_ISSUER_URL`
  - `OIDC_SERVER_ISSUER_URL`
  - `OIDC_CLIENT_ID`
  - `OIDC_CLIENT_SECRET`
  - `AUTH_SESSION_SECRET`
  - `REDIS_URL`

## Verification

### Frontend

```bash
cd frontend
npm ci
npm test
npm run check
npm run build
```

### Backend

```bash
cd backend
dotnet test
```

### Full local stack

```bash
cp infrastructure/.env.example infrastructure/.env
docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.dev.yml up --build -d
docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.dev.yml exec caddy caddy trust
./infrastructure/scripts/seed-keycloak-dev-users.sh
```

Expected results:

- the stack starts without manual container changes
- the frontend is reachable at `https://localhost`
- authentication endpoints are reachable at `https://localhost/auth`
- seeded accounts can sign in
- frontend tests and checks pass
- backend tests pass

## Operational notes

- The checked-in Keycloak realm is imported into a fresh Keycloak volume.
- User passwords are not stored in the checked-in realm export, so local users must be re-seeded after auth resets.
- The frontend is intended to be accessed through `https://localhost`, not by container port.
- The Docker setup keeps the backend internal-only and exposes public traffic through Caddy.
- Backend data protection keys are persisted through a Docker volume.
- Redis is used for both frontend session storage and rate limiting in the local stack.

## Troubleshooting

### Login stops working after recreating Keycloak

Re-seed the local Keycloak users:

```bash
./infrastructure/scripts/seed-keycloak-dev-users.sh
```

### Clean auth reset

```bash
docker compose -f infrastructure/docker-compose.yml down
docker volume rm infrastructure_keycloak_data
docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.dev.yml up --build
./infrastructure/scripts/seed-keycloak-dev-users.sh
```

### Full local reset

```bash
docker compose -f infrastructure/docker-compose.yml down
docker volume rm infrastructure_postgres_data infrastructure_keycloak_data infrastructure_caddy_data infrastructure_caddy_config infrastructure_backend_data_protection infrastructure_redis_data
docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.dev.yml up --build
./infrastructure/scripts/seed-keycloak-dev-users.sh
```

### HTTPS certificate warnings in the browser

- Re-run `docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.dev.yml exec caddy caddy trust`
- Restart the browser
- Make sure you are opening `https://localhost`, not `http://localhost`
