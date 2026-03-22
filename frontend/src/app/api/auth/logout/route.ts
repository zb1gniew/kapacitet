import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { APP_ROUTES } from "@/constants/routes";
import { buildEndSessionUrl } from "@/lib/auth/oidc";
import { parseSessionCookieValue } from "@/lib/auth/session";

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(AUTH_COOKIE_NAMES.session);
  response.cookies.delete(AUTH_COOKIE_NAMES.transaction);
}

function defaultRedirectUrl(request: NextRequest): URL {
  return new URL(APP_ROUTES.home, request.nextUrl.origin);
}

export async function POST(request: NextRequest) {
  const localRedirectUrl = defaultRedirectUrl(request);
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAMES.session)?.value;
  const session = sessionCookie
    ? await parseSessionCookieValue(sessionCookie)
    : null;
  const endSessionUrl = await buildEndSessionUrl({
    postLogoutRedirectUri: localRedirectUrl.toString(),
    idTokenHint: session?.idToken,
  });

  const response = NextResponse.redirect(endSessionUrl ?? localRedirectUrl);
  clearAuthCookies(response);
  return response;
}
