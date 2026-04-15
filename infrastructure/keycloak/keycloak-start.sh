#!/bin/sh
mkdir -p /opt/keycloak/data/import
sed 's/__OIDC_CLIENT_SECRET__/''/g' /opt/keycloak/kapacitet-realm.json.template > /opt/keycloak/data/import/kapacitet-realm.json
exec /opt/keycloak/bin/kc.sh start-dev --import-realm
