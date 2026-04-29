import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { APP_ROUTES } from "@/constants/routes";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { getAuthConfig } from "@/lib/auth/config";
import { buildAuthorizationUrl } from "@/lib/auth/oidc";
import { createCodeChallenge, createCodeVerifier, createRandomState } from "@/lib/auth/pkce";
import {
  createTransactionCookieValue,
  getTransactionCookieOptions,
} from "@/lib/auth/session";

vi.mock("@/lib/auth/config", () => ({
  getAuthConfig: vi.fn(),
}));

vi.mock("@/lib/auth/oidc", () => ({
  buildAuthorizationUrl: vi.fn(),
}));

vi.mock("@/lib/auth/pkce", () => ({
  createCodeChallenge: vi.fn(),
  createCodeVerifier: vi.fn(),
  createRandomState: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  createTransactionCookieValue: vi.fn(),
  getTransactionCookieOptions: vi.fn(),
}));

const mockedGetAuthConfig = vi.mocked(getAuthConfig);
const mockedBuildAuthorizationUrl = vi.mocked(buildAuthorizationUrl);
const mockedCreateCodeChallenge = vi.mocked(createCodeChallenge);
const mockedCreateCodeVerifier = vi.mocked(createCodeVerifier);
const mockedCreateRandomState = vi.mocked(createRandomState);
const mockedCreateTransactionCookieValue = vi.mocked(
  createTransactionCookieValue,
);
const mockedGetTransactionCookieOptions = vi.mocked(
  getTransactionCookieOptions,
);

describe("auth login route", () => {
  it("starts a login transaction and sanitizes invalid return targets", async () => {
    mockedGetAuthConfig.mockReturnValue({
      appUrl: "https://app.example",
      issuerUrl: "https://issuer.example",
      serverIssuerUrl: "https://issuer.example",
      clientId: "frontend",
      sessionSecret: "secret",
      cookieSecure: false,
      scopes: "openid",
    });
    mockedCreateRandomState.mockReturnValueOnce("state-1").mockReturnValueOnce(
      "nonce-1",
    );
    mockedCreateCodeVerifier.mockReturnValue("verifier-1");
    mockedCreateCodeChallenge.mockReturnValue("challenge-1");
    mockedBuildAuthorizationUrl.mockResolvedValue(
      "https://issuer.example/auth?state=state-1",
    );
    mockedCreateTransactionCookieValue.mockResolvedValue("cookie-value");
    mockedGetTransactionCookieOptions.mockReturnValue({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    const response = await GET(
      new NextRequest(
        "https://app.example/api/auth/login?return_to=https://evil.example",
      ),
    );

    expect(mockedBuildAuthorizationUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUri: "https://app.example/api/auth/callback",
        state: "state-1",
        nonce: "nonce-1",
        codeChallenge: "challenge-1",
      }),
    );
    expect(mockedCreateTransactionCookieValue).toHaveBeenCalledWith({
      state: "state-1",
      nonce: "nonce-1",
      codeVerifier: "verifier-1",
      returnTo: APP_ROUTES.dashboard,
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://issuer.example/auth?state=state-1",
    );
    expect(response.cookies.get(AUTH_COOKIE_NAMES.transaction)?.value).toBe(
      "cookie-value",
    );
  });

  it("uses posted login hints and valid return targets", async () => {
    mockedGetAuthConfig.mockReturnValue({
      appUrl: "https://app.example",
      issuerUrl: "https://issuer.example",
      serverIssuerUrl: "https://issuer.example",
      clientId: "frontend",
      sessionSecret: "secret",
      cookieSecure: false,
      scopes: "openid",
    });
    mockedCreateRandomState.mockReturnValueOnce("state-2").mockReturnValueOnce(
      "nonce-2",
    );
    mockedCreateCodeVerifier.mockReturnValue("verifier-2");
    mockedCreateCodeChallenge.mockReturnValue("challenge-2");
    mockedBuildAuthorizationUrl.mockResolvedValue(
      "https://issuer.example/auth?state=state-2",
    );
    mockedCreateTransactionCookieValue.mockResolvedValue("cookie-value-2");
    mockedGetTransactionCookieOptions.mockReturnValue({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    const formData = new FormData();
    formData.set("email", "user@example.com");
    formData.set("return_to", "/dashboard/matches");
    formData.set("idp_hint", "google");

    const response = await POST(
      new NextRequest("https://app.example/api/auth/login", {
        method: "POST",
        body: formData,
      }),
    );

    expect(mockedBuildAuthorizationUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        loginHint: "user@example.com",
        idpHint: "google",
      }),
    );
    expect(mockedCreateTransactionCookieValue).toHaveBeenCalledWith({
      state: "state-2",
      nonce: "nonce-2",
      codeVerifier: "verifier-2",
      returnTo: "/dashboard/matches",
    });
    expect(response.status).toBe(307);
  });
});
