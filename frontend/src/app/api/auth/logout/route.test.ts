import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { getAuthConfig } from "@/lib/auth/config";
import { buildEndSessionUrl } from "@/lib/auth/oidc";
import { parseSessionCookieValue } from "@/lib/auth/session";
import {
  deleteServerSession,
  getServerSession,
} from "@/lib/auth/session-store";

vi.mock("@/lib/auth/config", () => ({
  getAuthConfig: vi.fn(),
}));

vi.mock("@/lib/auth/oidc", () => ({
  buildEndSessionUrl: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  parseSessionCookieValue: vi.fn(),
}));

vi.mock("@/lib/auth/session-store", () => ({
  deleteServerSession: vi.fn(),
  getServerSession: vi.fn(),
}));

const mockedGetAuthConfig = vi.mocked(getAuthConfig);
const mockedBuildEndSessionUrl = vi.mocked(buildEndSessionUrl);
const mockedParseSessionCookieValue = vi.mocked(parseSessionCookieValue);
const mockedDeleteServerSession = vi.mocked(deleteServerSession);
const mockedGetServerSession = vi.mocked(getServerSession);

describe("auth logout route", () => {
  it("deletes the server session and redirects to the oidc end-session url", async () => {
    mockedGetAuthConfig.mockReturnValue({
      appUrl: "https://app.example",
      issuerUrl: "https://issuer.example",
      serverIssuerUrl: "https://issuer.example",
      clientId: "frontend",
      sessionSecret: "secret",
      cookieSecure: false,
      scopes: "openid",
    });
    mockedParseSessionCookieValue.mockResolvedValue("session-1");
    mockedGetServerSession.mockResolvedValue({
      user: { sub: "user-1" },
      accessToken: "token",
      idToken: "id-token",
      expiresAt: 1,
    });
    mockedBuildEndSessionUrl.mockResolvedValue(
      "https://issuer.example/logout?id_token_hint=id-token",
    );

    const request = new NextRequest("https://app.example/api/auth/logout", {
      method: "POST",
      headers: {
        cookie: `${AUTH_COOKIE_NAMES.session}=encrypted-session`,
      },
    });

    const response = await POST(request);

    expect(mockedDeleteServerSession).toHaveBeenCalledWith("session-1");
    expect(response.headers.get("location")).toBe(
      "https://issuer.example/logout?id_token_hint=id-token",
    );
    expect(response.cookies.get(AUTH_COOKIE_NAMES.session)?.value).toBe("");
    expect(response.cookies.get(AUTH_COOKIE_NAMES.transaction)?.value).toBe("");
  });

  it("falls back to the local home page when no end-session url is available", async () => {
    mockedGetAuthConfig.mockReturnValue({
      appUrl: "https://app.example",
      issuerUrl: "https://issuer.example",
      serverIssuerUrl: "https://issuer.example",
      clientId: "frontend",
      sessionSecret: "secret",
      cookieSecure: false,
      scopes: "openid",
    });
    mockedBuildEndSessionUrl.mockResolvedValue(null);

    const response = await POST(
      new NextRequest("https://app.example/api/auth/logout", {
        method: "POST",
      }),
    );

    expect(response.headers.get("location")).toBe("https://app.example/");
  });
});
