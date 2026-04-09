# Keycloak Realm Configuration

`kapacitet-realm.json` is the version-controlled source of truth for the local Keycloak realm used by this project.

## Overview

The Docker setup mounts `kapacitet-realm.json` into Keycloak's import directory and starts the server with `start-dev --import-realm`.

This provides a repeatable way to provision the local `kapacitet` realm with:

- Realm-level login and registration settings
- Realm roles required by the application
- The `kapacitet-app` OIDC client used by the frontend and backend

The import file is intentionally limited to shared configuration that should be reproducible across local environments.

## How Import Works

On container startup, Keycloak scans `/opt/keycloak/data/import` for realm definition files and imports any realms that do not already exist in the persisted database.

In this repository:

- `infrastructure/docker-compose.yml` mounts the checked-in realm file into `/opt/keycloak/data/import/kapacitet-realm.json`
- Keycloak is started with `start-dev --import-realm`
- On a fresh Keycloak data volume, the `kapacitet` realm is created automatically from the JSON file

This is a bootstrap mechanism, not a continuous sync. Once the realm exists in the Keycloak database, later container restarts continue using the persisted state.

## Starting Keycloak

Start the Keycloak service with:

```bash
docker compose -f infrastructure/docker-compose.yml up keycloak
```

The admin console is available at `http://localhost:8080/admin`.

Default local admin credentials:

- Username: `admin`
- Password: `admin`

## Re-Importing on a Clean Instance

If an older or incorrect realm has already been persisted, the import file will not overwrite it automatically. To force a clean import, remove the existing Keycloak volume and start the service again:

```bash
docker compose -f infrastructure/docker-compose.yml down
docker volume rm infrastructure_keycloak_data
docker compose -f infrastructure/docker-compose.yml up keycloak
```

Use this only when it is acceptable to recreate local Keycloak state.

## Updating the Checked-In Export

If the realm is updated through the Admin Console, regenerate the checked-in export from the running Keycloak container:

```bash
./infrastructure/scripts/export-keycloak-realm.sh
```

The script reads the active realm configuration from the running container and rewrites `infrastructure/keycloak/kapacitet-realm.json` with the normalized project export.

## Export Scope and Limitations

The checked-in export includes:

- Realm settings required by the application
- Custom realm roles
- The `kapacitet-app` client configuration

The checked-in export does not include:

- User passwords
- Non-essential built-in realm roles
- Local-only data that should not be treated as shared configuration

If local test users are needed after a clean import, create them again in Keycloak.
