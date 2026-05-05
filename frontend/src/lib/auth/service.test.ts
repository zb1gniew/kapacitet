import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AuthSession,
  OidcTokenResponse,
  OidcUserInfo,
} from "@/types/auth";
import {
  createAuthSession,
  isSessionExpired,
  refreshAuthSession,
  shouldRefreshSession,
} from "./service";
import { fetchUserInfo, refreshOidcToken } from "./oidc";

vi.mock("./oidc", () => ({
  fetchUserInfo: vi.fn(),
  refreshOidcToken: vi.fn(),
}));

vi.mock("@/lib/backend/config", () => ({
  getBackendApiBaseUrl: () => "http://backend-test",
}));

const mockedFetchUserInfo = vi.mocked(fetchUserInfo);
const mockedRefreshOidcToken = vi.mocked(refreshOidcToken);

function createJwt(payload: Record<string, unknown>) {
  const encoded = Buffer.from(JSON.stringify(payload))
    .toString("base64url")
    .replace(/=/g, "");
  return `header.${encoded}.signature`;
}

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockOnboardingStatus(appRole: string | null) {
  if (appRole === null) {
    mockFetch.mockResolvedValue({ ok: false });
  } else {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ appRole }),
    });
  }
}

describe("auth session service", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-04-28T10:00:00.000Z"));
    mockFetch.mockReset();
  });

  it("creates a session and extracts deduplicated roles from tokens", () => {
    const tokenResponse: OidcTokenResponse = {
      access_token: createJwt({
        realm_access: { roles: ["platform_admin", "member"] },
      }),
      id_token: createJwt({
        realm_access: { roles: ["member", "auditor"] },
      }),
      expires_in: 300,
      refresh_expires_in: 1800,
      refresh_token: "refresh-token",
      token_type: "Bearer",
    };
    const userInfo: OidcUserInfo = {
      sub: "user-1",
      email: "user@example.com",
      name: "User One",
      preferred_username: "user1",
      email_verified: true,
    };

    const session = createAuthSession(tokenResponse, userInfo);

    expect(session).toMatchObject({
      accessToken: tokenResponse.access_token,
      idToken: tokenResponse.id_token,
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      expiresAt: 1777370700,
      refreshExpiresAt: 1777372200,
      user: {
        sub: "user-1",
        roles: ["platform_admin", "member", "auditor"],
      },
    });
  });

  it("falls back to values from the previous session when refresh output is partial", () => {
    const previousSession: AuthSession = {
      user: { sub: "user-1", roles: ["existing-role"], appRole: "Viewer" },
      accessToken: "old-access",
      idToken: "old-id",
      tokenType: "Bearer",
      refreshToken: "old-refresh",
      expiresAt: 1,
      refreshExpiresAt: 2,
    };

    const session = createAuthSession(
      {
        access_token: "new-access",
        expires_in: 120,
      },
      { sub: "user-1" },
      previousSession,
    );

    expect(session.idToken).toBe("old-id");
    expect(session.refreshToken).toBe("old-refresh");
    expect(session.tokenType).toBe("Bearer");
    expect(session.user.roles).toEqual(["existing-role"]);
    expect(session.user.appRole).toBe("Viewer");
  });

  it("detects expired and near-expiry sessions", () => {
    const expiredSession: AuthSession = {
      user: { sub: "user-1" },
      accessToken: "token",
      expiresAt: 1777370399,
    };
    const freshSession: AuthSession = {
      user: { sub: "user-1" },
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: 1777370800,
    };
    const nearExpirySession: AuthSession = {
      user: { sub: "user-1" },
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: 1777370450,
    };

    expect(isSessionExpired(expiredSession)).toBe(true);
    expect(shouldRefreshSession(freshSession)).toBe(false);
    expect(shouldRefreshSession(nearExpirySession)).toBe(true);
  });

  it("refreshes the session when refresh succeeds", async () => {
    mockedRefreshOidcToken.mockResolvedValue({
      access_token: createJwt({ realm_access: { roles: ["member"] } }),
      refresh_token: "new-refresh",
      expires_in: 600,
      id_token: createJwt({ realm_access: { roles: ["auditor"] } }),
    });
    mockedFetchUserInfo.mockResolvedValue({
      sub: "user-1",
      email: "user@example.com",
    });
    mockOnboardingStatus("Manager");

    const refreshed = await refreshAuthSession({
      user: { sub: "user-1", appRole: "Admin" },
      accessToken: "old-token",
      refreshToken: "refresh-token",
      expiresAt: 1777370300,
    });

    expect(mockedRefreshOidcToken).toHaveBeenCalledWith("refresh-token");
    expect(mockedFetchUserInfo).toHaveBeenCalled();
    expect(refreshed?.refreshToken).toBe("new-refresh");
    expect(refreshed?.user.roles).toEqual(["member", "auditor"]);
    // appRole updated from backend, not carried from previous session
    expect(refreshed?.user.appRole).toBe("Manager");
  });

  it("falls back to previous appRole when backend is unreachable during refresh", async () => {
    mockedRefreshOidcToken.mockResolvedValue({
      access_token: createJwt({ realm_access: { roles: ["member"] } }),
      refresh_token: "new-refresh",
      expires_in: 600,
    });
    mockedFetchUserInfo.mockResolvedValue({ sub: "user-1" });
    mockOnboardingStatus(null); // backend returns error

    const refreshed = await refreshAuthSession({
      user: { sub: "user-1", appRole: "Viewer" },
      accessToken: "old-token",
      refreshToken: "refresh-token",
      expiresAt: 1777370300,
    });

    expect(refreshed?.user.appRole).toBe("Viewer");
  });

  it("re-fetches appRole on refresh to reflect role downgrades immediately", async () => {
    mockedRefreshOidcToken.mockResolvedValue({
      access_token: createJwt({ realm_access: { roles: ["member"] } }),
      refresh_token: "new-refresh",
      expires_in: 600,
    });
    mockedFetchUserInfo.mockResolvedValue({ sub: "user-1" });
    mockOnboardingStatus("Viewer"); // was Admin, now downgraded

    const refreshed = await refreshAuthSession({
      user: { sub: "user-1", appRole: "Admin" },
      accessToken: "old-token",
      refreshToken: "refresh-token",
      expiresAt: 1777370300,
    });

    expect(refreshed?.user.appRole).toBe("Viewer");
  });

  it("sets refreshExpiresAt to 30 days for offline tokens (refresh_expires_in === 0)", () => {
    const session = createAuthSession(
      {
        access_token: createJwt({ realm_access: { roles: ["member"] } }),
        expires_in: 300,
        refresh_token: "offline-token",
        refresh_expires_in: 0,
      },
      { sub: "user-1" },
      undefined,
      "Manager",
    );

    const now = Math.floor(Date.now() / 1000);
    expect(session.refreshExpiresAt).toBe(now + 30 * 24 * 60 * 60);
    expect(session.user.appRole).toBe("Manager");
  });

  it("returns null when refresh cannot be performed", async () => {
    mockedRefreshOidcToken.mockRejectedValue(new Error("refresh failed"));

    await expect(
      refreshAuthSession({
        user: { sub: "user-1" },
        accessToken: "old-token",
        refreshToken: "refresh-token",
        expiresAt: 1777370300,
      }),
    ).resolves.toBeNull();

    // No refresh token — returns null without calling oidc
    await expect(
      refreshAuthSession({
        user: { sub: "user-1" },
        accessToken: "old-token",
        expiresAt: 1777370300,
      }),
    ).resolves.toBeNull();
  });
});
