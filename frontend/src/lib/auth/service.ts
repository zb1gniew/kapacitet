import { AUTH_SESSION_REFRESH_WINDOW_SECONDS } from "@/constants/auth";
import type {
  AuthSession,
  AuthenticatedUser,
  OidcTokenResponse,
  OidcUserInfo,
} from "@/types/auth";
import { getBackendApiBaseUrl } from "@/lib/backend/config";
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
  appRole?: "Admin" | "Manager" | "Viewer",
): AuthenticatedUser {
  return {
    sub: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name,
    preferredUsername: userInfo.preferred_username,
    emailVerified: userInfo.email_verified,
    roles,
    appRole,
  };
}

export function createAuthSession(
  tokenResponse: OidcTokenResponse,
  userInfo: OidcUserInfo,
  previousSession?: AuthSession,
  appRole?: "Admin" | "Manager" | "Viewer",
): AuthSession {
  const now = nowInSeconds();
  const roles =
    extractRoles(tokenResponse.access_token, tokenResponse.id_token) ??
    previousSession?.user.roles;
  const resolvedAppRole = appRole ?? previousSession?.user.appRole;

  return {
    user: toUserProfile(userInfo, roles, resolvedAppRole),
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
    // Preserve onboarding status across token refreshes. Without this, every
    // 5-minute access-token refresh wipes onboardingCompleted → undefined, which
    // causes proxy.ts to treat the user as not-onboarded and redirect them to
    // /onboarding/welcome in an infinite loop with the onboarding page's own
    // "already done → /dashboard" redirect.
    onboardingCompleted: previousSession?.onboardingCompleted,
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

async function fetchAppRoleFromBackend(
  accessToken: string,
): Promise<"Admin" | "Manager" | "Viewer" | undefined> {
  try {
    const backendUrl = getBackendApiBaseUrl();
    const response = await fetch(`${backendUrl}/api/onboarding/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) {
      return undefined;
    }
    const status = (await response.json()) as { appRole?: string };
    if (
      status.appRole === "Admin" ||
      status.appRole === "Manager" ||
      status.appRole === "Viewer"
    ) {
      return status.appRole;
    }
    return undefined;
  } catch {
    return undefined;
  }
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
    // Re-fetch the app role on every refresh so role changes (e.g. Admin→Viewer)
    // are reflected without requiring the user to log out and back in.
    const freshAppRole =
      (await fetchAppRoleFromBackend(tokenResponse.access_token)) ??
      session.user.appRole;
    return createAuthSession(tokenResponse, userInfo, session, freshAppRole);
  } catch {
    return null;
  }
}
