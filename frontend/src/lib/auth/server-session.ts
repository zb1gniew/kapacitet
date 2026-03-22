import { cookies } from "next/headers";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import type { AuthSession } from "@/types/auth";
import { getAuthConfig } from "./config";
import {
  createSessionCookieValue,
  getSessionCookieOptions,
  parseSessionCookieValue,
} from "./session";
import {
  isSessionExpired,
  refreshAuthSession,
  shouldRefreshSession,
} from "./service";

export async function getServerAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(AUTH_COOKIE_NAMES.session)?.value;

  if (!value) {
    return null;
  }

  const parsedSession = await parseSessionCookieValue(value);
  if (!parsedSession) {
    return null;
  }

  let session = parsedSession;

  if (shouldRefreshSession(session)) {
    const refreshed = await refreshAuthSession(session);
    if (!refreshed) {
      return null;
    }

    session = refreshed;

    // In request contexts that allow cookie mutation, persist the refreshed session.
    try {
      const { cookieSecure } = getAuthConfig();
      const cookieValue = await createSessionCookieValue(session);
      cookieStore.set(
        AUTH_COOKIE_NAMES.session,
        cookieValue,
        getSessionCookieOptions(cookieSecure),
      );
    } catch {
      // Server components may expose a read-only cookie store; the refreshed
      // session is still valid for the current request.
    }
  }

  if (isSessionExpired(session)) {
    return null;
  }

  return session;
}
