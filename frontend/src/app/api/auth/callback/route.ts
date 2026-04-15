import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAMES,
  AUTH_SESSION_DEFAULT_MAX_AGE_SECONDS,
} from "@/constants/auth";
import { APP_ROUTES } from "@/constants/routes";
import { getAuthConfig } from "@/lib/auth/config";
import {
  exchangeAuthorizationCode,
  fetchUserInfo,
  getUserInfoFromIdToken,
  hasExpectedNonce,
} from "@/lib/auth/oidc";
import { createAuthSession } from "@/lib/auth/service";
import {
  createSessionCookieValue,
  getSessionCookieOptions,
  parseTransactionCookieValue,
} from "@/lib/auth/session";
import { createServerSession } from "@/lib/auth/session-store";
import { getBackendApiBaseUrl } from "@/lib/backend/config";

function buildRedirectUrl(path: string): URL {
  const { appUrl } = getAuthConfig();
  return new URL(path, appUrl);
}

function clearTransactionCookie(response: NextResponse) {
  response.cookies.delete(AUTH_COOKIE_NAMES.transaction);
}

function sessionMaxAgeSeconds(expiresAt?: number): number {
  if (!expiresAt) {
    return AUTH_SESSION_DEFAULT_MAX_AGE_SECONDS;
  }

  return Math.max(
    AUTH_SESSION_DEFAULT_MAX_AGE_SECONDS,
    expiresAt - Math.floor(Date.now() / 1000),
  );
}

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (error || !code || !state) {
    const redirectResponse = NextResponse.redirect(
      buildRedirectUrl(APP_ROUTES.home),
    );
    clearTransactionCookie(redirectResponse);
    return redirectResponse;
  }

  const transactionCookie = request.cookies.get(
    AUTH_COOKIE_NAMES.transaction,
  )?.value;
  if (!transactionCookie) {
    return NextResponse.redirect(buildRedirectUrl(APP_ROUTES.home));
  }

  const transaction = await parseTransactionCookieValue(transactionCookie);
  if (!transaction || transaction.state !== state) {
    const redirectResponse = NextResponse.redirect(
      buildRedirectUrl(APP_ROUTES.home),
    );
    clearTransactionCookie(redirectResponse);
    return redirectResponse;
  }

  try {
    const { appUrl } = getAuthConfig();
    const redirectUri = `${appUrl}${APP_ROUTES.authCallbackApi}`;
    const tokenResponse = await exchangeAuthorizationCode({
      code,
      codeVerifier: transaction.codeVerifier,
      redirectUri,
    });

    if (!(await hasExpectedNonce(tokenResponse.id_token, transaction.nonce))) {
      throw new Error("Invalid ID token nonce");
    }

    let userInfo;
    try {
      userInfo = await fetchUserInfo(tokenResponse.access_token);
    } catch (error) {
      userInfo = await getUserInfoFromIdToken(tokenResponse.id_token);
      if (!userInfo) {
        throw error;
      }
    }
    const session = createAuthSession(tokenResponse, userInfo);

    // Check onboarding status before persisting session
    let onboardingCompleted = false;
    try {
      const backendUrl = getBackendApiBaseUrl();
      const onboardingResponse = await fetch(
        `${backendUrl}/api/onboarding/status`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
          cache: "no-store",
        },
      );
      if (onboardingResponse.ok) {
        const status = await onboardingResponse.json();
        onboardingCompleted = status.isOnboardingCompleted === true;
      }
    } catch {
      // If the check fails, treat as not onboarded
    }

    session.onboardingCompleted = onboardingCompleted;

    const sessionId = await createServerSession(session);
    const sessionCookieValue = await createSessionCookieValue(
      sessionId,
      sessionMaxAgeSeconds(session.refreshExpiresAt ?? session.expiresAt),
    );
    const { cookieSecure } = getAuthConfig();

    const redirectTo = onboardingCompleted
      ? transaction.returnTo || APP_ROUTES.dashboard
      : APP_ROUTES.onboardingWelcome;

    const response = NextResponse.redirect(
      buildRedirectUrl(redirectTo),
    );

    response.cookies.set(
      AUTH_COOKIE_NAMES.session,
      sessionCookieValue,
      getSessionCookieOptions(
        cookieSecure,
        sessionMaxAgeSeconds(session.refreshExpiresAt ?? session.expiresAt),
      ),
    );
    clearTransactionCookie(response);

    return response;
  } catch (error) {
    console.error("Auth callback failed", error);
    const redirectResponse = NextResponse.redirect(
      buildRedirectUrl(APP_ROUTES.home),
    );
    clearTransactionCookie(redirectResponse);
    return redirectResponse;
  }
}
