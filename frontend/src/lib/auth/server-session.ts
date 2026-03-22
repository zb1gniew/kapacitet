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
  deleteServerSession,
  getServerSession,
  updateServerSession,
} from "./session-store";
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

  const sessionId = await parseSessionCookieValue(value);
  if (!sessionId) {
    return null;
  }

  const parsedSession = await getServerSession(sessionId);
  if (!parsedSession) {
    return null;
  }

  let session = parsedSession;

  if (shouldRefreshSession(session)) {
    const refreshed = await refreshAuthSession(session);
    if (!refreshed) {
      await deleteServerSession(sessionId);
      return null;
    }

    session = refreshed;
    await updateServerSession(sessionId, session);

    // In request contexts that allow cookie mutation, persist the refreshed session.
    try {
      const { cookieSecure } = getAuthConfig();
      const maxAgeSeconds =
        session.refreshExpiresAt && session.refreshExpiresAt > 0
          ? Math.max(
              60 * 60,
              session.refreshExpiresAt - Math.floor(Date.now() / 1000),
            )
          : 60 * 60;
      const cookieValue = await createSessionCookieValue(
        sessionId,
        maxAgeSeconds,
      );
      cookieStore.set(
        AUTH_COOKIE_NAMES.session,
        cookieValue,
        getSessionCookieOptions(cookieSecure, maxAgeSeconds),
      );
    } catch {
      // Server components may expose a read-only cookie store; the refreshed
      // session is still valid for the current request.
    }
  }

  if (isSessionExpired(session)) {
    await deleteServerSession(sessionId);
    return null;
  }

  return session;
}
