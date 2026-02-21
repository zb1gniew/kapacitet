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

function toUserProfile(userInfo: OidcUserInfo): AuthenticatedUser {
  return {
    sub: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name,
    preferredUsername: userInfo.preferred_username,
    emailVerified: userInfo.email_verified,
  };
}

export function createAuthSession(
  tokenResponse: OidcTokenResponse,
  userInfo: OidcUserInfo,
): AuthSession {
  const now = nowInSeconds();

  return {
    user: toUserProfile(userInfo),
    refreshToken: tokenResponse.refresh_token,
    expiresAt: now + tokenResponse.expires_in,
    refreshExpiresAt: tokenResponse.refresh_expires_in
      ? now + tokenResponse.refresh_expires_in
      : undefined,
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
    return createAuthSession(tokenResponse, userInfo);
  } catch {
    return null;
  }
}
