import { createRemoteJWKSet, jwtVerify } from "jose";
import type {
  OidcDiscoveryDocument,
  OidcTokenResponse,
  OidcUserInfo,
} from "@/types/auth";
import { getAuthConfig } from "./config";

let cachedDiscovery: OidcDiscoveryDocument | null = null;
let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

async function fetchDiscoveryDocument(): Promise<OidcDiscoveryDocument> {
  if (cachedDiscovery) {
    return cachedDiscovery;
  }

  const { issuerUrl } = getAuthConfig();
  const discoveryUrl = `${issuerUrl}/.well-known/openid-configuration`;

  const response = await fetch(discoveryUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`OIDC discovery failed with status ${response.status}`);
  }

  const body = (await response.json()) as OidcDiscoveryDocument;
  cachedDiscovery = body;
  return body;
}

type AuthorizationUrlInput = {
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
  loginHint?: string;
  idpHint?: string;
};

export async function buildAuthorizationUrl(
  input: AuthorizationUrlInput,
): Promise<string> {
  const discovery = await fetchDiscoveryDocument();
  const { clientId, scopes } = getAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: input.redirectUri,
    scope: scopes,
    state: input.state,
    nonce: input.nonce,
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
  });

  if (input.loginHint) {
    params.set("login_hint", input.loginHint);
  }

  if (input.idpHint) {
    params.set("kc_idp_hint", input.idpHint);
  }

  return `${discovery.authorization_endpoint}?${params.toString()}`;
}

function createTokenRequestHeaders(clientId: string, clientSecret?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  if (clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );
    headers.Authorization = `Basic ${credentials}`;
  }

  return headers;
}

async function performTokenRequest(
  bodyParams: URLSearchParams,
): Promise<OidcTokenResponse> {
  const discovery = await fetchDiscoveryDocument();
  const { clientId, clientSecret } = getAuthConfig();

  if (!clientSecret) {
    bodyParams.set("client_id", clientId);
  }

  const response = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: createTokenRequestHeaders(clientId, clientSecret),
    body: bodyParams.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const failureBody = await response.text();
    throw new Error(
      `OIDC token endpoint failed with status ${response.status}: ${failureBody}`,
    );
  }

  return (await response.json()) as OidcTokenResponse;
}

export async function exchangeAuthorizationCode(input: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<OidcTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    code_verifier: input.codeVerifier,
    redirect_uri: input.redirectUri,
  });

  return performTokenRequest(params);
}

export async function refreshOidcToken(
  refreshToken: string,
): Promise<OidcTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  return performTokenRequest(params);
}

export async function fetchUserInfo(
  accessToken: string,
): Promise<OidcUserInfo> {
  const discovery = await fetchDiscoveryDocument();
  const response = await fetch(discovery.userinfo_endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`OIDC userinfo failed with status ${response.status}`);
  }

  return (await response.json()) as OidcUserInfo;
}

export async function buildEndSessionUrl(input: {
  postLogoutRedirectUri: string;
  idTokenHint?: string;
}): Promise<string | null> {
  const discovery = await fetchDiscoveryDocument();
  if (!discovery.end_session_endpoint) {
    return null;
  }

  const params = new URLSearchParams({
    post_logout_redirect_uri: input.postLogoutRedirectUri,
  });

  if (input.idTokenHint) {
    params.set("id_token_hint", input.idTokenHint);
  }

  return `${discovery.end_session_endpoint}?${params.toString()}`;
}

export async function hasExpectedNonce(
  idToken: string | undefined,
  expectedNonce: string,
): Promise<boolean> {
  if (!idToken) {
    return false;
  }

  try {
    const discovery = await fetchDiscoveryDocument();
    const { clientId } = getAuthConfig();

    if (!cachedJwks) {
      cachedJwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
    }

    const verification = await jwtVerify(idToken, cachedJwks, {
      issuer: discovery.issuer,
      audience: clientId,
      clockTolerance: 5,
    });

    return verification.payload.nonce === expectedNonce;
  } catch {
    return false;
  }
}
