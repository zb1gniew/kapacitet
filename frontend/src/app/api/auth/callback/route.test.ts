import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { APP_ROUTES } from "@/constants/routes";
import { getAuthConfig } from "@/lib/auth/config";
import {
  exchangeAuthorizationCode,
  fetchUserInfo,
  hasExpectedNonce,
} from "@/lib/auth/oidc";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { createAuthSession } from "@/lib/auth/service";
import {
  createSessionCookieValue,
  getSessionCookieOptions,
  parseTransactionCookieValue,
} from "@/lib/auth/session";
import { createServerSession } from "@/lib/auth/session-store";
import { getBackendApiBaseUrl } from "@/lib/backend/config";
import type { AuthTransaction } from "@/types/auth";

vi.mock("@/lib/auth/config", () => ({ getAuthConfig: vi.fn() }));
vi.mock("@/lib/auth/oidc", () => ({
  exchangeAuthorizationCode: vi.fn(),
  fetchUserInfo: vi.fn(),
  getUserInfoFromIdToken: vi.fn(),
  hasExpectedNonce: vi.fn(),
}));
vi.mock("@/lib/auth/roles", () => ({ isPlatformAdmin: vi.fn() }));
vi.mock("@/lib/auth/service", () => ({ createAuthSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({
  createSessionCookieValue: vi.fn(),
  getSessionCookieOptions: vi.fn(),
  parseTransactionCookieValue: vi.fn(),
}));
vi.mock("@/lib/auth/session-store", () => ({ createServerSession: vi.fn() }));
vi.mock("@/lib/backend/config", () => ({ getBackendApiBaseUrl: vi.fn() }));

const mockedGetAuthConfig = vi.mocked(getAuthConfig);
const mockedExchangeAuthorizationCode = vi.mocked(exchangeAuthorizationCode);
const mockedFetchUserInfo = vi.mocked(fetchUserInfo);
const mockedHasExpectedNonce = vi.mocked(hasExpectedNonce);
const mockedIsPlatformAdmin = vi.mocked(isPlatformAdmin);
const mockedCreateAuthSession = vi.mocked(createAuthSession);
const mockedCreateSessionCookieValue = vi.mocked(createSessionCookieValue);
const mockedGetSessionCookieOptions = vi.mocked(getSessionCookieOptions);
const mockedParseTransactionCookieValue = vi.mocked(
  parseTransactionCookieValue,
);
const mockedCreateServerSession = vi.mocked(createServerSession);
const mockedGetBackendApiBaseUrl = vi.mocked(getBackendApiBaseUrl);

const AUTH_CONFIG = {
  appUrl: "https://app.example",
  issuerUrl: "https://issuer.example/realms/kapacitet",
  serverIssuerUrl: "https://issuer.example/realms/kapacitet",
  clientId: "frontend",
  sessionSecret: "secret",
  cookieSecure: false,
  scopes: "openid",
};

const TRANSACTION = {
  state: "state-1",
  codeVerifier: "verifier-1",
  nonce: "nonce-1",
  returnTo: "/dashboard/matches",
};

const TOKEN_RESPONSE = {
  access_token: "access",
  refresh_token: "refresh",
  id_token: "id",
  token_type: "Bearer",
  expires_in: 300,
};

const SESSION = {
  user: { sub: "user-1", email: "user@example.com", roles: ["User"] },
  accessToken: "access",
  refreshToken: "refresh",
  idToken: "id",
  expiresAt: 9999999999,
  refreshExpiresAt: 9999999999,
  onboardingCompleted: false,
};

function makeRequest(
  params: Record<string, string>,
  transactionCookie = "tx-cookie",
) {
  const url = new URL("https://app.example/api/auth/callback");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const req = new NextRequest(url);
  if (transactionCookie) {
    req.cookies.set(AUTH_COOKIE_NAMES.transaction, transactionCookie);
  }
  return req;
}

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
  mockedGetAuthConfig.mockReturnValue(AUTH_CONFIG);
});

describe("auth callback route", () => {
  it("redirects home with authError when error param is present", async () => {
    const req = makeRequest({ error: "access_denied", state: "state-1" });
    const response = await GET(req);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("authError=1");
  });

  it("redirects home with authError when code is missing", async () => {
    const req = makeRequest({ state: "state-1" });
    const response = await GET(req);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("authError=1");
  });

  it("redirects home when transaction cookie is absent", async () => {
    const req = makeRequest({ code: "code-1", state: "state-1" }, "");
    const response = await GET(req);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.example/");
  });

  it("redirects home with authError when state does not match transaction", async () => {
    mockedParseTransactionCookieValue.mockResolvedValue({
      ...TRANSACTION,
      state: "different-state",
    });
    const req = makeRequest({ code: "code-1", state: "state-1" });
    const response = await GET(req);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.example/");
  });

  it("completes login and redirects onboarded user to their returnTo path", async () => {
    mockedParseTransactionCookieValue.mockResolvedValue(TRANSACTION);
    mockedExchangeAuthorizationCode.mockResolvedValue(TOKEN_RESPONSE);
    mockedHasExpectedNonce.mockResolvedValue(true);
    mockedFetchUserInfo.mockResolvedValue({
      sub: "user-1",
      email: "user@example.com",
    });
    mockedCreateAuthSession.mockReturnValue(SESSION);
    mockedIsPlatformAdmin.mockReturnValue(false);
    mockedGetBackendApiBaseUrl.mockReturnValue("https://backend.example");
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          isOnboardingCompleted: true,
          appRole: "Manager",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );
    mockedCreateServerSession.mockResolvedValue("session-uuid");
    mockedCreateSessionCookieValue.mockResolvedValue("encrypted-session");
    mockedGetSessionCookieOptions.mockReturnValue({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });

    const req = makeRequest({ code: "code-1", state: "state-1" });
    const response = await GET(req);

    expect(mockedCreateServerSession).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ appRole: "Manager" }),
      }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://app.example/dashboard/matches",
    );
    expect(response.cookies.get(AUTH_COOKIE_NAMES.session)?.value).toBe(
      "encrypted-session",
    );
    expect(response.cookies.get(AUTH_COOKIE_NAMES.transaction)?.value).toBe("");
  });

  it("redirects non-onboarded user to onboarding welcome", async () => {
    mockedParseTransactionCookieValue.mockResolvedValue(TRANSACTION);
    mockedExchangeAuthorizationCode.mockResolvedValue(TOKEN_RESPONSE);
    mockedHasExpectedNonce.mockResolvedValue(true);
    mockedFetchUserInfo.mockResolvedValue({ sub: "user-1" });
    mockedCreateAuthSession.mockReturnValue(SESSION);
    mockedIsPlatformAdmin.mockReturnValue(false);
    mockedGetBackendApiBaseUrl.mockReturnValue("https://backend.example");
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          isOnboardingCompleted: false,
          appRole: "Viewer",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );
    mockedCreateServerSession.mockResolvedValue("session-uuid");
    mockedCreateSessionCookieValue.mockResolvedValue("encrypted-session");
    mockedGetSessionCookieOptions.mockReturnValue({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });

    const req = makeRequest({ code: "code-1", state: "state-1" });
    const response = await GET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `https://app.example${APP_ROUTES.onboardingWelcome}`,
    );
  });

  it("skips onboarding check for platform admins and redirects to dashboard", async () => {
    const transactionWithoutReturnTo: AuthTransaction = {
      state: TRANSACTION.state,
      codeVerifier: TRANSACTION.codeVerifier,
      nonce: TRANSACTION.nonce,
    };
    mockedParseTransactionCookieValue.mockResolvedValue(
      transactionWithoutReturnTo,
    );
    mockedExchangeAuthorizationCode.mockResolvedValue(TOKEN_RESPONSE);
    mockedHasExpectedNonce.mockResolvedValue(true);
    mockedFetchUserInfo.mockResolvedValue({ sub: "admin-1" });
    mockedCreateAuthSession.mockReturnValue(SESSION);
    mockedIsPlatformAdmin.mockReturnValue(true);
    mockedCreateServerSession.mockResolvedValue("session-uuid");
    mockedCreateSessionCookieValue.mockResolvedValue("encrypted-session");
    mockedGetSessionCookieOptions.mockReturnValue({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });

    const req = makeRequest({ code: "code-1", state: "state-1" });
    const response = await GET(req);

    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `https://app.example${APP_ROUTES.dashboard}`,
    );
  });

  it("redirects home with authError when token exchange fails", async () => {
    mockedParseTransactionCookieValue.mockResolvedValue(TRANSACTION);
    mockedExchangeAuthorizationCode.mockRejectedValue(new Error("token error"));

    const req = makeRequest({ code: "bad-code", state: "state-1" });
    const response = await GET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("authError=1");
  });
});
