import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { getAuthConfig } from "@/lib/auth/config";
import { getServerAuthSession } from "@/lib/auth/server-session";
import {
  createSessionCookieValue,
  getSessionCookieOptions,
  parseSessionCookieValue,
} from "@/lib/auth/session";

function unauthorizedResponse() {
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAMES.session)?.value;
  const session = await getServerAuthSession();
  if (!session || !sessionCookie) {
    const response = unauthorizedResponse();
    response.cookies.delete(AUTH_COOKIE_NAMES.session);
    return response;
  }

  const sessionId = await parseSessionCookieValue(sessionCookie);
  if (!sessionId) {
    const response = unauthorizedResponse();
    response.cookies.delete(AUTH_COOKIE_NAMES.session);
    return response;
  }

  const response = NextResponse.json({
    authenticated: true,
    user: session.user,
    expiresAt: session.expiresAt,
  });

  const { cookieSecure } = getAuthConfig();
  const maxAgeSeconds =
    session.refreshExpiresAt && session.refreshExpiresAt > 0
      ? Math.max(
          60 * 60,
          session.refreshExpiresAt - Math.floor(Date.now() / 1000),
        )
      : 60 * 60;
  const cookieValue = await createSessionCookieValue(sessionId, maxAgeSeconds);
  response.cookies.set(
    AUTH_COOKIE_NAMES.session,
    cookieValue,
    getSessionCookieOptions(cookieSecure, maxAgeSeconds),
  );

  return response;
}
