#!/usr/bin/env bash
# Seeds only the platform admin Keycloak account and configures the OIDC client.
# Run this once on a fresh production deployment.
#
# Required env vars:
#   PLATFORM_ADMIN_PASSWORD  - password for platform-admin@kapacitet.net
#   OIDC_CLIENT_SECRET       - client secret for the kapacitet-app OIDC client
#   KEYCLOAK_ADMIN_PASSWORD  - password for the Keycloak admin user
#
# Optional env vars (with defaults shown):
#   KEYCLOAK_BASE_URL        (https://auth.example.invalid)
#   KEYCLOAK_REALM           (kapacitet)
#   KEYCLOAK_ADMIN_REALM     (master)
#   KEYCLOAK_ADMIN_USER      (admin)
#   KEYCLOAK_VERIFY_TLS      (true)

set -euo pipefail

KEYCLOAK_BASE_URL="${KEYCLOAK_BASE_URL:-https://auth.example.invalid}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-kapacitet}"
KEYCLOAK_ADMIN_REALM="${KEYCLOAK_ADMIN_REALM:-master}"
KEYCLOAK_ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:?KEYCLOAK_ADMIN_PASSWORD is required}"
KEYCLOAK_VERIFY_TLS="${KEYCLOAK_VERIFY_TLS:-true}"
OIDC_CLIENT_SECRET="${OIDC_CLIENT_SECRET:?OIDC_CLIENT_SECRET is required}"
PLATFORM_ADMIN_PASSWORD="${PLATFORM_ADMIN_PASSWORD:?PLATFORM_ADMIN_PASSWORD is required}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required" >&2
  exit 1
fi

export KEYCLOAK_BASE_URL
export KEYCLOAK_REALM
export KEYCLOAK_ADMIN_REALM
export KEYCLOAK_ADMIN_USER
export KEYCLOAK_ADMIN_PASSWORD
export KEYCLOAK_VERIFY_TLS
export OIDC_CLIENT_SECRET
export PLATFORM_ADMIN_PASSWORD

python3 <<'PY'
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

base_url = os.environ["KEYCLOAK_BASE_URL"].rstrip("/")
realm = os.environ["KEYCLOAK_REALM"]
admin_realm = os.environ["KEYCLOAK_ADMIN_REALM"]
admin_user = os.environ["KEYCLOAK_ADMIN_USER"]
admin_password = os.environ["KEYCLOAK_ADMIN_PASSWORD"]
verify_tls = os.environ["KEYCLOAK_VERIFY_TLS"].lower() in {"1", "true", "yes"}
oidc_client_secret = os.environ["OIDC_CLIENT_SECRET"]
platform_admin_password = os.environ["PLATFORM_ADMIN_PASSWORD"]

ctx = ssl.create_default_context() if verify_tls else ssl._create_unverified_context()


def request(method: str, path: str, data=None, headers=None, expected=(200, 201, 204)):
    url = f"{base_url}{path}"
    body = None
    req_headers = dict(headers or {})

    if data is not None:
        if isinstance(data, (dict, list)):
            body = json.dumps(data).encode()
            req_headers.setdefault("Content-Type", "application/json")
        elif isinstance(data, str):
            body = data.encode()
        else:
            body = data

    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)

    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            payload = response.read().decode()
            if response.status not in expected:
                raise RuntimeError(f"{method} {path} returned unexpected status {response.status}: {payload}")
            return response.status, payload
    except urllib.error.HTTPError as exc:
        payload = exc.read().decode()
        raise RuntimeError(f"{method} {path} failed with {exc.code}: {payload}") from exc


def get_admin_token() -> str:
    payload = urllib.parse.urlencode(
        {
            "grant_type": "password",
            "client_id": "admin-cli",
            "username": admin_user,
            "password": admin_password,
        }
    )
    _, body = request(
        "POST",
        f"/realms/{admin_realm}/protocol/openid-connect/token",
        payload,
        {"Content-Type": "application/x-www-form-urlencoded"},
    )
    return json.loads(body)["access_token"]


def wait_until_ready(timeout_seconds: int = 90) -> str:
    deadline = time.time() + timeout_seconds
    last_error = None

    while time.time() < deadline:
        try:
            return get_admin_token()
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            time.sleep(2)

    raise RuntimeError(f"Keycloak at {base_url} did not become ready in time: {last_error}")


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def get_user_by_username(token: str, username: str):
    query = urllib.parse.urlencode({"username": username, "exact": "true"})
    _, body = request("GET", f"/admin/realms/{realm}/users?{query}", headers=auth_headers(token))
    users_payload = json.loads(body)
    return users_payload[0] if users_payload else None


def ensure_password(token: str, user_id: str, password: str):
    request(
        "PUT",
        f"/admin/realms/{realm}/users/{user_id}/reset-password",
        {
            "type": "password",
            "value": password,
            "temporary": True,
        },
        headers=auth_headers(token),
        expected=(204,),
    )


def ensure_realm_role(token: str, user_id: str, role_name: str):
    _, role_body = request("GET", f"/admin/realms/{realm}/roles/{urllib.parse.quote(role_name, safe='')}", headers=auth_headers(token))
    role = json.loads(role_body)

    _, mapping_body = request("GET", f"/admin/realms/{realm}/users/{user_id}/role-mappings/realm", headers=auth_headers(token))
    current_roles = {item["name"] for item in json.loads(mapping_body)}

    if role_name in current_roles:
        return

    request(
        "POST",
        f"/admin/realms/{realm}/users/{user_id}/role-mappings/realm",
        [role],
        headers=auth_headers(token),
        expected=(204,),
    )


def ensure_client_secret(token: str):
    query = urllib.parse.urlencode({"clientId": "kapacitet-app"})
    _, body = request("GET", f"/admin/realms/{realm}/clients?{query}", headers=auth_headers(token))
    clients = json.loads(body)
    if not clients:
        raise RuntimeError("Keycloak client 'kapacitet-app' not found")

    client = clients[0]
    client["secret"] = oidc_client_secret
    client["publicClient"] = False
    client["clientAuthenticatorType"] = "client-secret"

    request(
        "PUT",
        f"/admin/realms/{realm}/clients/{client['id']}",
        client,
        headers=auth_headers(token),
        expected=(204,),
    )


def main():
    token = wait_until_ready()
    print(f"Connected to {base_url} realm {realm}")
    ensure_client_secret(token)
    print("updated: kapacitet-app client secret")

    email = "platform-admin@kapacitet.net"
    user = get_user_by_username(token, email)
    created = False

    if user is None:
        request(
            "POST",
            f"/admin/realms/{realm}/users",
            {
                "username": email,
                "email": email,
                "enabled": True,
                "emailVerified": True,
                "firstName": "Platform",
                "lastName": "Admin",
            },
            headers=auth_headers(token),
            expected=(201,),
        )
        user = get_user_by_username(token, email)
        created = True

    if user is None:
        raise RuntimeError(f"User {email} was not found after create")

    # Password is set as temporary so the admin is forced to change it on first login.
    ensure_password(token, user["id"], platform_admin_password)
    ensure_realm_role(token, user["id"], "Admin")

    state = "created" if created else "updated"
    print(f"{state}: {email} with realm role Admin (temporary password set)")
    print("Keycloak production setup complete.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        sys.exit(1)
PY
