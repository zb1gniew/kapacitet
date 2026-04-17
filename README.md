# Kapacitet

Kapacitet is a capacity coordination platform for verified companies. It lets one company publish workforce demand, another company publish available capacity, and the platform create anonymized matches that become visible only after both sides confirm.

This README provides a technical overview of the project, including architecture, technologies, repository structure, local setup, and operational notes for development.

## Contents

- [Quick start](#quick-start)
- [Overview](#overview)
- [Stack](#stack)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Local development](#local-development)
- [Authentication and authorization](#authentication-and-authorization)
- [Local seed data](#local-seed-data)
- [Recovery steps](#recovery-steps)
- [Useful checks](#useful-checks)

## Quick start

```bash
cp infrastructure/.env.example infrastructure/.env
docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.dev.yml up --build
docker exec -it caddy caddy trust
./infrastructure/scripts/seed-keycloak-dev-users.sh
```

Then open:

- App: `https://localhost`
- Keycloak admin: `https://auth.localhost/admin`

## Overview

Kapacitet consists of a Next.js frontend, an ASP.NET Core backend, PostgreSQL for application persistence, Keycloak for identity management, and Caddy for local HTTPS termination and routing.

The platform supports:

- company onboarding and access requests,
- company-scoped availability and capacity publishing,
- match generation and agreement flows,
- administrative review and operational oversight,
- server-side authenticated application access through OIDC.

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: ASP.NET Core Web API, Entity Framework Core
- Database: PostgreSQL 15
- Identity: Keycloak OIDC with Authorization Code Flow + PKCE
- Local reverse proxy and TLS: Caddy
- Local orchestration: Docker Compose

## Architecture

### System overview

- The frontend handles the user experience and keeps auth server-side.
- The backend owns business logic for onboarding, matching, agreements, notifications, and admin workflows.
- PostgreSQL stores application state.
- Keycloak manages identity, login, and token issuance.
- Caddy provides local HTTPS and routes traffic to the frontend and auth services.

### Runtime components

- `frontend/` serves the browser app and uses a server-side session/BFF style auth flow.
- `backend/` exposes the business API, performs matching, provisioning, onboarding, and admin operations.
- `postgres` stores application data.
- `keycloak` stores identities and issues tokens.
- `caddy` terminates HTTPS and exposes local URLs that behave like production.

### Auth model

- Users sign in through Keycloak, not directly inside the app UI.
- The frontend keeps tokens server-side in encrypted `HttpOnly` cookies.
- The browser never stores bearer tokens in `localStorage`.
- The backend validates JWTs against the Keycloak realm.

### Core domains

- Company onboarding: request access, admin review, company/user provisioning, first-time password setup.
- Capacity marketplace: declare availability, request capacity, generate anonymized matches, requester acceptance, supplier confirmation, active agreement.
- Admin workspace: access request review, company registry, audit timeline, platform preferences.

## Repository layout

- `frontend/`: Next.js app and UI flows
- `backend/`: ASP.NET solution, API, application services, EF Core persistence, tests
- `infrastructure/`: Docker Compose, Caddy, Keycloak realm/theme, helper scripts
- `postman/`: workspace data for API exploration

## Local development

### Prerequisites

- Docker Desktop
- .NET 8 SDK if you want to run backend tests outside containers
- Node.js 20+ if you want to run the frontend outside Docker

### First-time setup

1. Create the infrastructure env file.

```bash
cp infrastructure/.env.example infrastructure/.env
```

2. Set at least `AUTH_SESSION_SECRET` in `infrastructure/.env`.

Suggested values:

- `AUTH_SESSION_SECRET`: any long random string
- `OIDC_CLIENT_SECRET`: optional for the local flow unless your Keycloak client requires it
- `Email__ApiKey`: optional in local dev when `Email__DevMode=true`

3. Start the local stack.

```bash
docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.dev.yml up --build
```

4. Trust Caddy's local certificate once on your machine.

```bash
docker exec -it caddy caddy trust
```

5. Seed the Keycloak login accounts after a fresh Keycloak import.

```bash
./infrastructure/scripts/seed-keycloak-dev-users.sh
```

### Local URLs

- App: `https://localhost`
- Keycloak realm issuer: `https://auth.localhost/realms/kapacitet`
- Keycloak admin console: `https://auth.localhost/admin`

### What starts automatically

- PostgreSQL on `localhost:5432`
- Backend API inside Docker
- Frontend dev server behind Caddy
- Keycloak with the checked-in `kapacitet` realm import

### Notes

- The checked-in Keycloak realm config is imported on a fresh Keycloak volume.
- User passwords are not stored in the realm export, so local seeded users must be re-seeded after auth resets.
- The Keycloak seed script creates the local seeded accounts and keeps platform-admin access limited to the dedicated platform admin user.
- The frontend is intended to be accessed through `https://localhost`, not directly by container port.

## Authentication and authorization

- Authentication is handled through Keycloak using OpenID Connect Authorization Code Flow with PKCE.
- The frontend uses a server-side session/BFF pattern and forwards authenticated backend requests from the server layer.
- Application users are stored in the project database and linked to companies.
- Platform administration access is controlled through Keycloak realm roles.
- Company-level permissions are represented in the application database through `Admin`, `Manager`, and `Viewer` roles.

## Local seed data

The local development seed creates a realistic initial state for the platform:

- multiple active companies,
- multiple users per company,
- company settings and notification preferences,
- active availability declarations,
- active capacity requests,
- open matches,
- an existing cooperation agreement for populated dashboards.

### Seeded accounts

The following local accounts are created by the database and Keycloak seeders:

After running `./infrastructure/scripts/seed-keycloak-dev-users.sh`:

- `platform-admin@kapacitet.net` / `Password123`
- `testuser@kapacitet.net` / `Password123`
- `request.manager@kapacitet.net` / `Password123`
- `request.viewer@kapacitet.net` / `Password123`
- `supplier@kapacitet.net` / `Password123`
- `supplier.manager@kapacitet.net` / `Password123`
- `supplier.viewer@kapacitet.net` / `Password123`
- `partner.admin@kapacitet.net` / `Password123`
- `partner.manager@kapacitet.net` / `Password123`
- `partner.viewer@kapacitet.net` / `Password123`
- Keycloak admin: `admin` / `admin`

## Recovery steps

### If login stops working after recreating Keycloak

Keycloak does not keep user passwords in the checked-in realm export. Re-seed the local users:

```bash
./infrastructure/scripts/seed-keycloak-dev-users.sh
```

### If you need a clean auth reset

This recreates the Keycloak realm and then re-seeds the local accounts:

```bash
docker compose -f infrastructure/docker-compose.yml down
docker volume rm infrastructure_keycloak_data
docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.dev.yml up --build
./infrastructure/scripts/seed-keycloak-dev-users.sh
```

### If you need a full local reset

This clears database, auth, and local proxy state:

```bash
docker compose -f infrastructure/docker-compose.yml down
docker volume rm infrastructure_postgres_data infrastructure_keycloak_data infrastructure_caddy_data infrastructure_caddy_config
docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.dev.yml up --build
./infrastructure/scripts/seed-keycloak-dev-users.sh
```

### If HTTPS looks broken in the browser

- Re-run `docker exec -it caddy caddy trust`
- Restart the browser
- Make sure you are opening `https://localhost`, not `http://localhost`

## Useful checks

### Frontend

```bash
cd frontend
npm install
npm run check
npm run build
```

### Backend

```bash
cd backend
dotnet test
```
