import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { APP_ROUTES } from "@/constants/routes";
import { getAuthConfig } from "@/lib/auth/config";
import { buildEndSessionUrl } from "@/lib/auth/oidc";
import { parseSessionCookieValue } from "@/lib/auth/session";
import {
  deleteServerSession,
  getServerSession,
} from "@/lib/auth/session-store";

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(AUTH_COOKIE_NAMES.session);
  response.cookies.delete(AUTH_COOKIE_NAMES.transaction);
}

function defaultRedirectUrl(): URL {
  const { appUrl } = getAuthConfig();
  return new URL(APP_ROUTES.home, appUrl);
}

export async function POST(request: NextRequest) {
  const localRedirectUrl = defaultRedirectUrl();
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAMES.session)?.value;
  const sessionId = sessionCookie
    ? await parseSessionCookieValue(sessionCookie)
    : null;
  const session = sessionId ? await getServerSession(sessionId) : null;
  const endSessionUrl = await buildEndSessionUrl({
    postLogoutRedirectUri: localRedirectUrl.toString(),
    idTokenHint: session?.idToken,
  });

  if (sessionId) {
    await deleteServerSession(sessionId);
  }

  const response = NextResponse.redirect(endSessionUrl ?? localRedirectUrl);
  clearAuthCookies(response);
  return response;
}
