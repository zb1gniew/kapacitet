#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_FILE="${1:-${INFRA_DIR}/keycloak/kapacitet-realm.json}"
REALM_NAME="${KEYCLOAK_REALM:-kapacitet}"
CLIENT_ID="${KEYCLOAK_CLIENT_ID:-kapacitet-app}"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 1
fi

KEYCLOAK_CONTAINER_ID="$(docker compose -f "${INFRA_DIR}/docker-compose.yml" ps -q keycloak)"

if [[ -z "${KEYCLOAK_CONTAINER_ID}" ]]; then
  echo "Keycloak container is not running. Start it with docker compose first." >&2
  exit 1
fi

tmp_config="/tmp/kcadm-export-$$.config"
trap 'docker exec "${KEYCLOAK_CONTAINER_ID}" rm -f "${tmp_config}" >/dev/null 2>&1 || true' EXIT

docker exec "${KEYCLOAK_CONTAINER_ID}" sh -lc \
  "/opt/keycloak/bin/kcadm.sh config credentials --config ${tmp_config} --server http://localhost:8080 --realm master --user ${ADMIN_USER} --password ${ADMIN_PASSWORD} >/dev/null"

realm_json="$(docker exec "${KEYCLOAK_CONTAINER_ID}" sh -lc \
  "/opt/keycloak/bin/kcadm.sh get realms/${REALM_NAME} --config ${tmp_config}")"

client_json="$(docker exec "${KEYCLOAK_CONTAINER_ID}" sh -lc \
  "/opt/keycloak/bin/kcadm.sh get clients -r ${REALM_NAME} -q clientId=${CLIENT_ID} --config ${tmp_config}")"

roles_json="$(docker exec "${KEYCLOAK_CONTAINER_ID}" sh -lc \
  "/opt/keycloak/bin/kcadm.sh get roles -r ${REALM_NAME} --config ${tmp_config}")"

mkdir -p "$(dirname "${OUTPUT_FILE}")"

jq -n \
  --argjson realm "${realm_json}" \
  --argjson clients "${client_json}" \
  --argjson roles "${roles_json}" \
  --arg clientId "${CLIENT_ID}" \
  '{
    realm: $realm.realm,
    enabled: $realm.enabled,
    registrationAllowed: $realm.registrationAllowed,
    registrationEmailAsUsername: $realm.registrationEmailAsUsername,
    rememberMe: $realm.rememberMe,
    verifyEmail: $realm.verifyEmail,
    loginWithEmailAllowed: $realm.loginWithEmailAllowed,
    duplicateEmailsAllowed: $realm.duplicateEmailsAllowed,
    resetPasswordAllowed: $realm.resetPasswordAllowed,
    editUsernameAllowed: $realm.editUsernameAllowed,
    roles: {
      realm: (
        $roles
        | map(select(.name != "default-roles-\($realm.realm)" and .name != "offline_access" and .name != "uma_authorization"))
        | map({
            name,
            description: (.description // "")
          })
      )
    },
    clients: (
      $clients
      | map(select(.clientId == $clientId))
      | map({
          clientId,
          name: (.name // .clientId),
          protocol,
          rootUrl,
          baseUrl,
          adminUrl,
          enabled,
          publicClient,
          standardFlowEnabled,
          implicitFlowEnabled,
          directAccessGrantsEnabled,
          serviceAccountsEnabled,
          redirectUris,
          webOrigins,
          attributes: (.attributes // {}),
          defaultClientScopes: (.defaultClientScopes // []),
          optionalClientScopes: (.optionalClientScopes // [])
        })
    )
  }' > "${OUTPUT_FILE}"

echo "Exported realm to ${OUTPUT_FILE}"
