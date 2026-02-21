import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { APP_ROUTES } from "@/constants/routes";
import { getAuthConfig } from "@/lib/auth/config";
import { buildAuthorizationUrl } from "@/lib/auth/oidc";
import { createCodeChallenge, createCodeVerifier, createRandomState } from "@/lib/auth/pkce";
import {
  createTransactionCookieValue,
  getTransactionCookieOptions,
} from "@/lib/auth/session";
import type { AuthTransaction } from "@/types/auth";

function sanitizeReturnTo(value: string | null): string {
  if (!value) {
    return APP_ROUTES.dashboard;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return APP_ROUTES.dashboard;
  }

  return value;
}

function getRedirectUri(request: NextRequest): string {
  return `${request.nextUrl.origin}${APP_ROUTES.authCallbackApi}`;
}

function createLoginResponse(
  request: NextRequest,
  input: {
    returnTo: string;
    loginHint?: string;
    idpHint?: string;
  },
) {
  const state = createRandomState();
  const nonce = createRandomState();
  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  const redirectUri = getRedirectUri(request);

  const transaction: AuthTransaction = {
    state,
    nonce,
    codeVerifier,
    returnTo: sanitizeReturnTo(input.returnTo),
  };

  return buildAuthorizationUrl({
    redirectUri,
    state,
    nonce,
    codeChallenge,
    loginHint: input.loginHint,
    idpHint: input.idpHint,
  }).then(async (authorizationUrl) => {
    const cookieValue = await createTransactionCookieValue(transaction);
    const { cookieSecure } = getAuthConfig();
    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set(
      AUTH_COOKIE_NAMES.transaction,
      cookieValue,
      getTransactionCookieOptions(cookieSecure),
    );

    return response;
  });
}

export async function GET(request: NextRequest) {
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("return_to"));
  const loginHint = request.nextUrl.searchParams.get("login_hint") ?? undefined;
  const idpHint = request.nextUrl.searchParams.get("idp_hint") ?? undefined;

  return createLoginResponse(request, {
    returnTo,
    loginHint,
    idpHint,
  });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const emailField = formData.get("email");
  const returnToField = formData.get("return_to");
  const idpHintField = formData.get("idp_hint");

  return createLoginResponse(request, {
    returnTo:
      typeof returnToField === "string"
        ? sanitizeReturnTo(returnToField)
        : APP_ROUTES.dashboard,
    loginHint: typeof emailField === "string" ? emailField : undefined,
    idpHint: typeof idpHintField === "string" ? idpHintField : undefined,
  });
}
