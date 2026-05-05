import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthConfig } from "./config";

vi.mock("./config", () => ({ getAuthConfig: vi.fn() }));
vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn().mockReturnValue("jwks-set"),
  jwtVerify: vi.fn(),
}));

const mockedGetAuthConfig = vi.mocked(getAuthConfig);

const AUTH_CONFIG = {
  appUrl: "https://app.example",
  issuerUrl: "https://issuer.example/realms/kapacitet",
  serverIssuerUrl: "https://server-issuer.internal/realms/kapacitet",
  clientId: "frontend",
  sessionSecret: "secret",
  cookieSecure: false,
  scopes: "openid email profile",
};

const DISCOVERY = {
  authorization_endpoint:
    "https://server-issuer.internal/realms/kapacitet/protocol/openid-connect/auth",
  token_endpoint:
    "https://server-issuer.internal/realms/kapacitet/protocol/openid-connect/token",
  userinfo_endpoint:
    "https://server-issuer.internal/realms/kapacitet/protocol/openid-connect/userinfo",
  end_session_endpoint:
    "https://server-issuer.internal/realms/kapacitet/protocol/openid-connect/logout",
  jwks_uri:
    "https://server-issuer.internal/realms/kapacitet/protocol/openid-connect/certs",
};

// Re-import after each test so module-level caches (cachedDiscovery, cachedJwks) reset
afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

function mockDiscoveryFetch(doc = DISCOVERY) {
  global.fetch = vi.fn().mockResolvedValueOnce(
    new Response(JSON.stringify(doc), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("buildAuthorizationUrl", () => {
  beforeEach(() => {
    mockedGetAuthConfig.mockReturnValue(AUTH_CONFIG);
  });

  it("builds a URL using the browser-mapped authorization endpoint", async () => {
    mockDiscoveryFetch();
    const { buildAuthorizationUrl } = await import("./oidc");

    const url = await buildAuthorizationUrl({
      redirectUri: "https://app.example/api/auth/callback",
      state: "state-1",
      nonce: "nonce-1",
      codeChallenge: "challenge-1",
    });

    // Endpoint is remapped to the browser-facing issuerUrl origin
    expect(url).toContain("https://issuer.example");
    expect(url).toContain("state=state-1");
    expect(url).toContain("nonce=nonce-1");
    expect(url).toContain("code_challenge=challenge-1");
    expect(url).toContain("client_id=frontend");
    expect(url).toContain("code_challenge_method=S256");
  });

  it("appends login_hint and kc_idp_hint when provided", async () => {
    mockDiscoveryFetch();
    const { buildAuthorizationUrl } = await import("./oidc");

    const url = await buildAuthorizationUrl({
      redirectUri: "https://app.example/api/auth/callback",
      state: "s",
      nonce: "n",
      codeChallenge: "c",
      loginHint: "user@example.com",
      idpHint: "google",
    });

    expect(url).toContain("login_hint=user%40example.com");
    expect(url).toContain("kc_idp_hint=google");
  });

  it("throws when the discovery endpoint returns a non-ok response", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 }));
    const { buildAuthorizationUrl } = await import("./oidc");

    await expect(
      buildAuthorizationUrl({
        redirectUri: "r",
        state: "s",
        nonce: "n",
        codeChallenge: "c",
      }),
    ).rejects.toThrow("OIDC discovery failed with status 503");
  });
});

describe("exchangeAuthorizationCode", () => {
  beforeEach(() => {
    mockedGetAuthConfig.mockReturnValue(AUTH_CONFIG);
  });

  it("posts an authorization_code grant and returns the token response", async () => {
    const tokenResponse = {
      access_token: "access",
      refresh_token: "refresh",
      id_token: "id",
      expires_in: 300,
      token_type: "Bearer",
    };
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(DISCOVERY), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(tokenResponse), { status: 200 }),
      );

    const { exchangeAuthorizationCode } = await import("./oidc");

    const result = await exchangeAuthorizationCode({
      code: "auth-code",
      codeVerifier: "verifier",
      redirectUri: "https://app.example/api/auth/callback",
    });

    expect(result).toEqual(tokenResponse);

    const tokenCall = vi.mocked(global.fetch).mock.calls[1];
    const body = new URLSearchParams(tokenCall?.[1]?.body as string);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("auth-code");
    expect(body.get("code_verifier")).toBe("verifier");
    expect(body.get("client_id")).toBe("frontend");
  });

  it("sends Basic auth header instead of client_id when clientSecret is set", async () => {
    mockedGetAuthConfig.mockReturnValue({
      ...AUTH_CONFIG,
      clientSecret: "s3cr3t",
    });
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(DISCOVERY), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "t", expires_in: 300 }), {
          status: 200,
        }),
      );

    const { exchangeAuthorizationCode } = await import("./oidc");
    await exchangeAuthorizationCode({
      code: "c",
      codeVerifier: "v",
      redirectUri: "r",
    });

    const tokenCall = vi.mocked(global.fetch).mock.calls[1];
    const headers = tokenCall?.[1]?.headers as Record<string, string>;
    expect(headers["Authorization"]).toMatch(/^Basic /);

    const body = new URLSearchParams(tokenCall?.[1]?.body as string);
    expect(body.has("client_id")).toBe(false);
  });

  it("throws when the token endpoint returns a non-ok response", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(DISCOVERY), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("invalid_grant", { status: 400 }));

    const { exchangeAuthorizationCode } = await import("./oidc");

    await expect(
      exchangeAuthorizationCode({
        code: "c",
        codeVerifier: "v",
        redirectUri: "r",
      }),
    ).rejects.toThrow("OIDC token endpoint failed with status 400");
  });
});

describe("fetchUserInfo", () => {
  beforeEach(() => {
    mockedGetAuthConfig.mockReturnValue(AUTH_CONFIG);
  });

  it("calls the userinfo endpoint with the bearer token", async () => {
    const userInfo = { sub: "user-1", email: "u@example.com" };
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(DISCOVERY), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(userInfo), { status: 200 }),
      );

    const { fetchUserInfo } = await import("./oidc");
    const result = await fetchUserInfo("my-access-token");

    expect(result).toEqual(userInfo);
    const call = vi.mocked(global.fetch).mock.calls[1];
    const headers = call?.[1]?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer my-access-token");
  });

  it("throws when the userinfo endpoint returns a non-ok response", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(DISCOVERY), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    const { fetchUserInfo } = await import("./oidc");

    await expect(fetchUserInfo("bad-token")).rejects.toThrow(
      "OIDC userinfo failed with status 401",
    );
  });
});

describe("buildEndSessionUrl", () => {
  beforeEach(() => {
    mockedGetAuthConfig.mockReturnValue(AUTH_CONFIG);
  });

  it("builds a logout URL with browser-mapped origin and optional id_token_hint", async () => {
    mockDiscoveryFetch();
    const { buildEndSessionUrl } = await import("./oidc");

    const url = await buildEndSessionUrl({
      postLogoutRedirectUri: "https://app.example/",
      idTokenHint: "id-token",
    });

    expect(url).toContain("https://issuer.example");
    expect(url).toContain("post_logout_redirect_uri=");
    expect(url).toContain("id_token_hint=id-token");
  });

  it("returns null when the discovery doc has no end_session_endpoint", async () => {
    const docWithoutLogout = { ...DISCOVERY, end_session_endpoint: undefined };
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(docWithoutLogout), { status: 200 }),
      );
    const { buildEndSessionUrl } = await import("./oidc");

    await expect(
      buildEndSessionUrl({ postLogoutRedirectUri: "https://app.example/" }),
    ).resolves.toBeNull();
  });
});

describe("hasExpectedNonce", () => {
  beforeEach(() => {
    mockedGetAuthConfig.mockReturnValue(AUTH_CONFIG);
  });

  it("returns false when idToken is undefined", async () => {
    const { hasExpectedNonce } = await import("./oidc");

    await expect(hasExpectedNonce(undefined, "nonce-1")).resolves.toBe(false);
  });

  it("returns false when JWT verification fails", async () => {
    const { jwtVerify } = await import("jose");
    mockDiscoveryFetch();
    vi.mocked(jwtVerify).mockRejectedValue(new Error("invalid signature"));

    const { hasExpectedNonce } = await import("./oidc");

    await expect(hasExpectedNonce("bad.token.here", "nonce-1")).resolves.toBe(
      false,
    );
  });

  it("returns true when the verified nonce matches", async () => {
    const { jwtVerify } = await import("jose");
    mockDiscoveryFetch();
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { nonce: "nonce-1" },
    } as never);

    const { hasExpectedNonce } = await import("./oidc");

    await expect(hasExpectedNonce("valid.token.here", "nonce-1")).resolves.toBe(
      true,
    );
  });
});

describe("getUserInfoFromIdToken", () => {
  beforeEach(() => {
    mockedGetAuthConfig.mockReturnValue(AUTH_CONFIG);
  });

  it("returns null when idToken is undefined", async () => {
    const { getUserInfoFromIdToken } = await import("./oidc");

    await expect(getUserInfoFromIdToken(undefined)).resolves.toBeNull();
  });

  it("returns null when the token has no sub claim", async () => {
    const { jwtVerify } = await import("jose");
    mockDiscoveryFetch();
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { email: "u@example.com" },
    } as never);

    const { getUserInfoFromIdToken } = await import("./oidc");

    await expect(getUserInfoFromIdToken("token")).resolves.toBeNull();
  });

  it("extracts user info fields from the verified token payload", async () => {
    const { jwtVerify } = await import("jose");
    mockDiscoveryFetch();
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        sub: "user-1",
        email: "u@example.com",
        name: "User One",
        preferred_username: "user1",
        email_verified: true,
      },
    } as never);

    const { getUserInfoFromIdToken } = await import("./oidc");
    const result = await getUserInfoFromIdToken("token");

    expect(result).toEqual({
      sub: "user-1",
      email: "u@example.com",
      name: "User One",
      preferred_username: "user1",
      email_verified: true,
    });
  });
});
