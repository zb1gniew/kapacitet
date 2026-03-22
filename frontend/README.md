## Frontend

Next.js app for KapacitetNet.

## Auth Architecture

- Keycloak OIDC Authorization Code Flow with PKCE (`/api/auth/login` + `/api/auth/callback`).
- Redirect-based sign-in for enterprise/B2B identity workflows.
- Email/password is verified on Keycloak's hosted login page (not handled by the app directly).
- No auth tokens in `localStorage`.
- Full BFF/server-session model: tokens stay server-side in encrypted `HttpOnly` cookies and browser code never handles bearer tokens.
- Dashboard route is server-protected.
- Server-side API calls should go through `src/lib/backend/server-client.ts`, which forwards the user's access token to the backend API.
- Future MitID Erhverv support: configure MitID as an external IdP in Keycloak and (optionally) pass `idp_hint` to `/api/auth/login`.

## Environment

Copy `.env.example` to `.env.local` and set values:

```bash
cp .env.example .env.local
```

Required:

- `OIDC_ISSUER_URL`
- `OIDC_CLIENT_ID`
- `AUTH_SESSION_SECRET`
- `BACKEND_API_URL`

Optional:

- `OIDC_CLIENT_SECRET` (recommended for confidential clients)
- `OIDC_SCOPES`
- `AUTH_COOKIE_SECURE`

## Keycloak Client Setup

Configure your Keycloak client with:

- Standard Flow enabled (Authorization Code Flow)
- PKCE enabled (`S256`)
- Valid redirect URI: `https://<your-app>/api/auth/callback` (and local dev URL)
- Valid post-logout redirect URI: `https://<your-app>/`
- `openid profile email` scopes enabled (`offline_access` recommended for refresh)

For MitID Erhverv later:

- Add MitID as an external IdP (Identity Brokering) in Keycloak.
- Keep app code unchanged; optionally send `idp_hint=<broker-alias>` to `/api/auth/login`.

## Run

```bash
npm install
npm run dev
```

Example local `BACKEND_API_URL`: `http://localhost:5000`

## Quality Checks

```bash
npm run check
npm run build
npm run format
```
