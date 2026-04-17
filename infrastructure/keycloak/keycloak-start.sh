#!/bin/sh
# Inject the OIDC client secret into the realm template before import.
mkdir -p /opt/keycloak/data/import
chmod 777 /opt/keycloak/data/import
sed "s/__OIDC_CLIENT_SECRET__/${OIDC_CLIENT_SECRET}/g" \
  /opt/keycloak/kapacitet-realm.json.template \
  > /opt/keycloak/data/import/kapacitet-realm.json

exec /opt/keycloak/bin/kc.sh start-dev --import-realm
