import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { cookies } from "next/headers";
import { getAuthConfig } from "@/lib/auth/config";
import { getServerAuthSession } from "@/lib/auth/server-session";
import {
  createSessionCookieValue,
  getSessionCookieOptions,
  parseSessionCookieValue,
} from "@/lib/auth/session";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({
  getAuthConfig: vi.fn(),
}));

vi.mock("@/lib/auth/server-session", () => ({
  getServerAuthSession: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  createSessionCookieValue: vi.fn(),
  getSessionCookieOptions: vi.fn(),
  parseSessionCookieValue: vi.fn(),
}));

const mockedCookies = vi.mocked(cookies);
const mockedGetAuthConfig = vi.mocked(getAuthConfig);
const mockedGetServerAuthSession = vi.mocked(getServerAuthSession);
const mockedCreateSessionCookieValue = vi.mocked(createSessionCookieValue);
const mockedGetSessionCookieOptions = vi.mocked(getSessionCookieOptions);
const mockedParseSessionCookieValue = vi.mocked(parseSessionCookieValue);

describe("auth me route", () => {
  it("returns unauthorized and clears the session cookie when auth is missing", async () => {
    mockedCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);
    mockedGetServerAuthSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ authenticated: false });
    expect(response.cookies.get(AUTH_COOKIE_NAMES.session)?.value).toBe("");
  });

  it("returns the authenticated user and refreshes the cookie", async () => {
    mockedCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "encrypted-session" }),
    } as never);
    mockedGetServerAuthSession.mockResolvedValue({
      user: { sub: "user-1", email: "user@example.com" },
      accessToken: "token",
      expiresAt: 1777370700,
      refreshExpiresAt: 1777372200,
    });
    mockedParseSessionCookieValue.mockResolvedValue("session-1");
    mockedGetAuthConfig.mockReturnValue({
      appUrl: "https://app.example",
      issuerUrl: "https://issuer.example",
      serverIssuerUrl: "https://issuer.example",
      clientId: "frontend",
      sessionSecret: "secret",
      cookieSecure: false,
      scopes: "openid",
    });
    mockedCreateSessionCookieValue.mockResolvedValue("new-cookie");
    mockedGetSessionCookieOptions.mockReturnValue({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      authenticated: true,
      user: { sub: "user-1", email: "user@example.com" },
      expiresAt: 1777370700,
    });
    expect(mockedCreateSessionCookieValue).toHaveBeenCalledWith(
      "session-1",
      expect.any(Number),
    );
    expect(response.cookies.get(AUTH_COOKIE_NAMES.session)?.value).toBe(
      "new-cookie",
    );
  });
});
