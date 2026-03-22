import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { getAuthConfig } from "@/lib/auth/config";
import { getServerAuthSession } from "@/lib/auth/server-session";
import {
  createSessionCookieValue,
  getSessionCookieOptions,
} from "@/lib/auth/session";

function unauthorizedResponse() {
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function GET() {
  const session = await getServerAuthSession();
  if (!session) {
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
  const cookieValue = await createSessionCookieValue(session);
  response.cookies.set(
    AUTH_COOKIE_NAMES.session,
    cookieValue,
    getSessionCookieOptions(cookieSecure),
  );

  return response;
}
