#!/bin/sh
# Inject the OIDC client secret into the realm template before import.
mkdir -p /opt/keycloak/data/import
escaped_client_secret=$(printf '%s\n' "$OIDC_CLIENT_SECRET" | sed 's/[\/&]/\\&/g')
sed "s/__OIDC_CLIENT_SECRET__/${escaped_client_secret}/g" \
  /opt/keycloak/kapacitet-realm.json.template \
  > /opt/keycloak/data/import/kapacitet-realm.json

exec /opt/keycloak/bin/kc.sh start-dev --import-realm
