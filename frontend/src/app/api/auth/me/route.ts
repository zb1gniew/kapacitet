import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { getAuthConfig } from "@/lib/auth/config";
import {
  isSessionExpired,
  refreshAuthSession,
  shouldRefreshSession,
} from "@/lib/auth/service";
import {
  createSessionCookieValue,
  getSessionCookieOptions,
  parseSessionCookieValue,
} from "@/lib/auth/session";

function unauthorizedResponse() {
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAMES.session)?.value;
  if (!sessionCookie) {
    return unauthorizedResponse();
  }

  const parsedSession = await parseSessionCookieValue(sessionCookie);
  if (!parsedSession) {
    const response = unauthorizedResponse();
    response.cookies.delete(AUTH_COOKIE_NAMES.session);
    return response;
  }

  let session = parsedSession;

  if (shouldRefreshSession(session)) {
    const refreshed = await refreshAuthSession(session);
    if (!refreshed) {
      const response = unauthorizedResponse();
      response.cookies.delete(AUTH_COOKIE_NAMES.session);
      return response;
    }

    session = refreshed;
  }

  if (isSessionExpired(session)) {
    const response = unauthorizedResponse();
    response.cookies.delete(AUTH_COOKIE_NAMES.session);
    return response;
  }

  const response = NextResponse.json({
    authenticated: true,
    user: session.user,
    expiresAt: session.expiresAt,
  });

  if (session !== parsedSession) {
    const { cookieSecure } = getAuthConfig();
    const cookieValue = await createSessionCookieValue(session);
    response.cookies.set(
      AUTH_COOKIE_NAMES.session,
      cookieValue,
      getSessionCookieOptions(cookieSecure),
    );
  }

  return response;
}
