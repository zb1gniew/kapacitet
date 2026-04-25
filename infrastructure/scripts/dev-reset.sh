#!/usr/bin/env bash
# Wipes all dev state and brings everything back to a clean, consistent state:
#   - Fresh Postgres DB (re-seeded by the backend on startup)
#   - Fresh Keycloak realm (re-imported from template, users re-seeded)
#
# Usage: bash scripts/dev-reset.sh [--no-rebuild]
#   --no-rebuild  Skip rebuilding Docker images (faster if code hasn't changed)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${INFRA_DIR}"

REBUILD=true
for arg in "$@"; do
  [[ "$arg" == "--no-rebuild" ]] && REBUILD=false
done

echo "==> Stopping all services..."
docker compose down --remove-orphans

echo "==> Removing data volumes..."
docker volume rm infrastructure_postgres_data infrastructure_keycloak_data 2>/dev/null || true

if [[ "$REBUILD" == "true" ]]; then
  echo "==> Rebuilding images..."
  docker compose build frontend backend
fi

echo "==> Starting services..."
docker compose up -d

echo "==> Waiting for backend to apply migrations and seed DB..."
timeout 120 bash -c '
  until docker compose logs backend 2>&1 | grep -q "Application started"; do
    sleep 3
  done
' || { echo "ERROR: Backend did not start in time. Check: docker compose logs backend"; exit 1; }

echo "==> Seeding Keycloak users..."
KEYCLOAK_BASE_URL=https://localhost/auth \
KEYCLOAK_VERIFY_TLS=false \
bash scripts/seed-keycloak-dev-users.sh

echo ""
echo "Done. Dev environment is clean and ready."
echo ""
echo "  Platform admin : platform-admin@kapacitet.net / Password123"
echo "  Test user      : testuser@kapacitet.net       / Password123"
echo "  Supplier admin : supplier@kapacitet.net        / Password123"
echo ""
echo "  App: https://localhost"
