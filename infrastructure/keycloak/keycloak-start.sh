#!/bin/sh
# Inject secrets from environment variables into the realm template before import.
# The template uses __OIDC_CLIENT_SECRET__ as a placeholder.
mkdir -p /opt/keycloak/data/import
sed "s/__OIDC_CLIENT_SECRET__/${OIDC_CLIENT_SECRET}/g" \
  /opt/keycloak/kapacitet-realm.json.template \
  > /opt/keycloak/data/import/kapacitet-realm.json

exec /opt/keycloak/bin/kc.sh start-dev --import-realm
