import { AUTH_SESSION_REFRESH_WINDOW_SECONDS } from "@/constants/auth";
import type {
  AuthSession,
  AuthenticatedUser,
  OidcTokenResponse,
  OidcUserInfo,
} from "@/types/auth";
import { fetchUserInfo, refreshOidcToken } from "./oidc";

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function parseJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) {
    return null;
  }

  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }

  try {
    const payload = segments[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(segments[1].length / 4) * 4, "=");

    return JSON.parse(
      Buffer.from(payload, "base64").toString("utf8"),
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractRoles(
  accessToken?: string,
  idToken?: string,
): string[] | undefined {
  const payloads = [parseJwtPayload(accessToken), parseJwtPayload(idToken)];
  const roles = new Set<string>();

  for (const payload of payloads) {
    const roleEntries = payload?.realm_access;
    if (!roleEntries || typeof roleEntries !== "object") {
      continue;
    }

    const realmRoles = (roleEntries as { roles?: unknown }).roles;
    if (!Array.isArray(realmRoles)) {
      continue;
    }

    for (const role of realmRoles) {
      if (typeof role === "string" && role.length > 0) {
        roles.add(role);
      }
    }
  }

  return roles.size > 0 ? Array.from(roles) : undefined;
}

function toUserProfile(
  userInfo: OidcUserInfo,
  roles?: string[],
): AuthenticatedUser {
  return {
    sub: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name,
    preferredUsername: userInfo.preferred_username,
    emailVerified: userInfo.email_verified,
    roles,
  };
}

export function createAuthSession(
  tokenResponse: OidcTokenResponse,
  userInfo: OidcUserInfo,
  previousSession?: AuthSession,
): AuthSession {
  const now = nowInSeconds();
  const roles =
    extractRoles(tokenResponse.access_token, tokenResponse.id_token) ??
    previousSession?.user.roles;

  return {
    user: toUserProfile(userInfo, roles),
    accessToken: tokenResponse.access_token,
    idToken: tokenResponse.id_token ?? previousSession?.idToken,
    tokenType: tokenResponse.token_type ?? previousSession?.tokenType,
    refreshToken: tokenResponse.refresh_token ?? previousSession?.refreshToken,
    expiresAt: now + tokenResponse.expires_in,
    // Keycloak returns refresh_expires_in = 0 for offline tokens (meaning no expiry).
    // Treating 0 as falsy would cause Redis TTL and cookie maxAge to fall back to the
    // 5-minute access token lifetime, logging the user out after 5 minutes of inactivity.
    refreshExpiresAt:
      tokenResponse.refresh_expires_in != null &&
      tokenResponse.refresh_expires_in > 0
        ? now + tokenResponse.refresh_expires_in
        : tokenResponse.refresh_expires_in === 0
          ? now + 30 * 24 * 60 * 60
          : previousSession?.refreshExpiresAt,
  };
}

export function isSessionExpired(session: AuthSession): boolean {
  return session.expiresAt <= nowInSeconds();
}

export function shouldRefreshSession(session: AuthSession): boolean {
  return (
    !!session.refreshToken &&
    session.expiresAt <= nowInSeconds() + AUTH_SESSION_REFRESH_WINDOW_SECONDS
  );
}

export async function refreshAuthSession(
  session: AuthSession,
): Promise<AuthSession | null> {
  if (!session.refreshToken) {
    return null;
  }

  try {
    const tokenResponse = await refreshOidcToken(session.refreshToken);
    const userInfo = await fetchUserInfo(tokenResponse.access_token);
    return createAuthSession(tokenResponse, userInfo, session);
  } catch {
    return null;
  }
}
