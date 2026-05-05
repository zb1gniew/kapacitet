import { describe, expect, it, vi, beforeEach } from "vitest";
import { getServerAuthSession } from "./server-session";
import { cookies } from "next/headers";
import { getAuthConfig } from "./config";
import {
  createSessionCookieValue,
  getSessionCookieOptions,
  parseSessionCookieValue,
} from "./session";
import {
  deleteServerSession,
  getServerSession,
  updateServerSession,
} from "./session-store";
import {
  isSessionExpired,
  refreshAuthSession,
  shouldRefreshSession,
} from "./service";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("./config", () => ({ getAuthConfig: vi.fn() }));
vi.mock("./session", () => ({
  parseSessionCookieValue: vi.fn(),
  createSessionCookieValue: vi.fn(),
  getSessionCookieOptions: vi.fn(),
}));
vi.mock("./session-store", () => ({
  getServerSession: vi.fn(),
  deleteServerSession: vi.fn(),
  updateServerSession: vi.fn(),
}));
vi.mock("./service", () => ({
  isSessionExpired: vi.fn(),
  refreshAuthSession: vi.fn(),
  shouldRefreshSession: vi.fn(),
}));

const mockedCookies = vi.mocked(cookies);
const mockedGetAuthConfig = vi.mocked(getAuthConfig);
const mockedParseSessionCookieValue = vi.mocked(parseSessionCookieValue);
const mockedCreateSessionCookieValue = vi.mocked(createSessionCookieValue);
const mockedGetSessionCookieOptions = vi.mocked(getSessionCookieOptions);
const mockedGetServerSession = vi.mocked(getServerSession);
const mockedDeleteServerSession = vi.mocked(deleteServerSession);
const mockedUpdateServerSession = vi.mocked(updateServerSession);
const mockedIsSessionExpired = vi.mocked(isSessionExpired);
const mockedRefreshAuthSession = vi.mocked(refreshAuthSession);
const mockedShouldRefreshSession = vi.mocked(shouldRefreshSession);

const LIVE_SESSION = {
  user: { sub: "user-1", email: "user@example.com" },
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresAt: 9999999999,
  refreshExpiresAt: 9999999999,
};

const AUTH_CONFIG = {
  appUrl: "https://app.example",
  issuerUrl: "https://issuer.example",
  serverIssuerUrl: "https://issuer.example",
  clientId: "frontend",
  sessionSecret: "secret",
  cookieSecure: false,
  scopes: "openid",
};

type MockCookieStore = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

function makeCookieStore(value?: string) {
  return {
    get: vi.fn().mockReturnValue(value ? { value } : undefined),
    set: vi.fn(),
  } as MockCookieStore;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getServerAuthSession", () => {
  it("returns null when the session cookie is absent", async () => {
    mockedCookies.mockResolvedValue(makeCookieStore() as never);

    await expect(getServerAuthSession()).resolves.toBeNull();
    expect(mockedGetServerSession).not.toHaveBeenCalled();
  });

  it("returns null when the cookie value cannot be decrypted", async () => {
    mockedCookies.mockResolvedValue(makeCookieStore("bad-cookie") as never);
    mockedParseSessionCookieValue.mockResolvedValue(null);

    await expect(getServerAuthSession()).resolves.toBeNull();
  });

  it("returns null when no session exists in the store for the session ID", async () => {
    mockedCookies.mockResolvedValue(makeCookieStore("valid-cookie") as never);
    mockedParseSessionCookieValue.mockResolvedValue("session-uuid");
    mockedGetServerSession.mockResolvedValue(null);

    await expect(getServerAuthSession()).resolves.toBeNull();
  });

  it("returns the session directly when no refresh is needed and it is not expired", async () => {
    mockedCookies.mockResolvedValue(makeCookieStore("valid-cookie") as never);
    mockedParseSessionCookieValue.mockResolvedValue("session-uuid");
    mockedGetServerSession.mockResolvedValue(LIVE_SESSION);
    mockedShouldRefreshSession.mockReturnValue(false);
    mockedIsSessionExpired.mockReturnValue(false);

    const result = await getServerAuthSession();

    expect(result).toEqual(LIVE_SESSION);
    expect(mockedRefreshAuthSession).not.toHaveBeenCalled();
    expect(mockedDeleteServerSession).not.toHaveBeenCalled();
  });

  it("returns null and deletes the session when it is expired", async () => {
    mockedCookies.mockResolvedValue(makeCookieStore("valid-cookie") as never);
    mockedParseSessionCookieValue.mockResolvedValue("session-uuid");
    mockedGetServerSession.mockResolvedValue(LIVE_SESSION);
    mockedShouldRefreshSession.mockReturnValue(false);
    mockedIsSessionExpired.mockReturnValue(true);

    await expect(getServerAuthSession()).resolves.toBeNull();
    expect(mockedDeleteServerSession).toHaveBeenCalledWith("session-uuid");
  });

  it("refreshes the session when shouldRefreshSession is true and refresh succeeds", async () => {
    const refreshedSession = { ...LIVE_SESSION, accessToken: "new-token" };
    const cookieStore = makeCookieStore("valid-cookie");
    mockedCookies.mockResolvedValue(cookieStore as never);
    mockedParseSessionCookieValue.mockResolvedValue("session-uuid");
    mockedGetServerSession.mockResolvedValue(LIVE_SESSION);
    mockedShouldRefreshSession.mockReturnValue(true);
    mockedRefreshAuthSession.mockResolvedValue(refreshedSession);
    mockedIsSessionExpired.mockReturnValue(false);
    mockedGetAuthConfig.mockReturnValue(AUTH_CONFIG);
    mockedCreateSessionCookieValue.mockResolvedValue("new-cookie");
    mockedGetSessionCookieOptions.mockReturnValue({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });

    const result = await getServerAuthSession();

    expect(result).toEqual(refreshedSession);
    expect(mockedUpdateServerSession).toHaveBeenCalledWith(
      "session-uuid",
      refreshedSession,
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      AUTH_COOKIE_NAMES.session,
      "new-cookie",
      expect.any(Object),
    );
  });

  it("deletes session and returns null when refresh fails", async () => {
    mockedCookies.mockResolvedValue(makeCookieStore("valid-cookie") as never);
    mockedParseSessionCookieValue.mockResolvedValue("session-uuid");
    mockedGetServerSession.mockResolvedValue(LIVE_SESSION);
    mockedShouldRefreshSession.mockReturnValue(true);
    mockedRefreshAuthSession.mockResolvedValue(null);

    await expect(getServerAuthSession()).resolves.toBeNull();
    expect(mockedDeleteServerSession).toHaveBeenCalledWith("session-uuid");
    expect(mockedUpdateServerSession).not.toHaveBeenCalled();
  });

  it("still returns the refreshed session when the cookie store is read-only", async () => {
    const refreshedSession = { ...LIVE_SESSION, accessToken: "new-token" };
    const cookieStore = {
      get: vi.fn().mockReturnValue({ value: "valid-cookie" }),
      set: vi.fn().mockImplementation(() => {
        throw new Error("read-only store");
      }),
    } as never;

    mockedCookies.mockResolvedValue(cookieStore as never);
    mockedParseSessionCookieValue.mockResolvedValue("session-uuid");
    mockedGetServerSession.mockResolvedValue(LIVE_SESSION);
    mockedShouldRefreshSession.mockReturnValue(true);
    mockedRefreshAuthSession.mockResolvedValue(refreshedSession);
    mockedIsSessionExpired.mockReturnValue(false);
    mockedGetAuthConfig.mockReturnValue(AUTH_CONFIG);
    mockedCreateSessionCookieValue.mockResolvedValue("new-cookie");
    mockedGetSessionCookieOptions.mockReturnValue({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });

    const result = await getServerAuthSession();

    expect(result).toEqual(refreshedSession);
  });
});
