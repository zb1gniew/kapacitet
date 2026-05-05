import { afterEach, describe, expect, it, vi } from "vitest";

const BASE_ENV = {
  APP_PUBLIC_URL: "https://app.example/",
  OIDC_ISSUER_URL: "https://issuer.example/realms/kapacitet/",
  OIDC_CLIENT_ID: "frontend",
  AUTH_SESSION_SECRET: "super-secret",
  NODE_ENV: "test",
};

afterEach(() => {
  vi.resetModules();
  // Restore baseline env so later tests start clean
  Object.assign(process.env, BASE_ENV);
  for (const key of [
    "OIDC_SERVER_ISSUER_URL",
    "OIDC_SCOPES",
    "OIDC_CLIENT_SECRET",
    "AUTH_COOKIE_SECURE",
  ]) {
    delete process.env[key];
  }
});

describe("getAuthConfig URL normalisation", () => {
  it("strips trailing slashes from appUrl and issuerUrl", async () => {
    Object.assign(process.env, BASE_ENV);
    const { getAuthConfig } = await import("./config");
    const cfg = getAuthConfig();

    expect(cfg.appUrl).toBe("https://app.example");
    expect(cfg.issuerUrl).toBe("https://issuer.example/realms/kapacitet");
  });

  it("falls back serverIssuerUrl to issuerUrl when OIDC_SERVER_ISSUER_URL is not set", async () => {
    Object.assign(process.env, BASE_ENV);
    const { getAuthConfig } = await import("./config");

    expect(getAuthConfig().serverIssuerUrl).toBe(
      "https://issuer.example/realms/kapacitet",
    );
  });

  it("uses OIDC_SERVER_ISSUER_URL and strips its trailing slash", async () => {
    Object.assign(process.env, {
      ...BASE_ENV,
      OIDC_SERVER_ISSUER_URL: "http://keycloak:8080/realms/kapacitet/",
    });
    const { getAuthConfig } = await import("./config");

    expect(getAuthConfig().serverIssuerUrl).toBe(
      "http://keycloak:8080/realms/kapacitet",
    );
  });
});

describe("getAuthConfig optional fields", () => {
  it("defaults scopes to OIDC_SCOPES_DEFAULT when OIDC_SCOPES is not set", async () => {
    Object.assign(process.env, BASE_ENV);
    const { getAuthConfig } = await import("./config");
    const { OIDC_SCOPES_DEFAULT } = await import("@/constants/auth");

    expect(getAuthConfig().scopes).toBe(OIDC_SCOPES_DEFAULT);
  });

  it("uses OIDC_SCOPES when provided", async () => {
    Object.assign(process.env, {
      ...BASE_ENV,
      OIDC_SCOPES: "openid profile email",
    });
    const { getAuthConfig } = await import("./config");

    expect(getAuthConfig().scopes).toBe("openid profile email");
  });

  it("includes clientSecret when OIDC_CLIENT_SECRET is set", async () => {
    Object.assign(process.env, { ...BASE_ENV, OIDC_CLIENT_SECRET: "s3cr3t" });
    const { getAuthConfig } = await import("./config");

    expect(getAuthConfig().clientSecret).toBe("s3cr3t");
  });

  it("leaves clientSecret undefined when OIDC_CLIENT_SECRET is not set", async () => {
    Object.assign(process.env, BASE_ENV);
    const { getAuthConfig } = await import("./config");

    expect(getAuthConfig().clientSecret).toBeUndefined();
  });
});

describe("getAuthConfig cookieSecure", () => {
  it("is true when AUTH_COOKIE_SECURE=true regardless of NODE_ENV", async () => {
    Object.assign(process.env, {
      ...BASE_ENV,
      NODE_ENV: "development",
      AUTH_COOKIE_SECURE: "true",
    });
    const { getAuthConfig } = await import("./config");

    expect(getAuthConfig().cookieSecure).toBe(true);
  });

  it("is false when AUTH_COOKIE_SECURE=false even in production", async () => {
    Object.assign(process.env, {
      ...BASE_ENV,
      NODE_ENV: "production",
      AUTH_COOKIE_SECURE: "false",
    });
    const { getAuthConfig } = await import("./config");

    expect(getAuthConfig().cookieSecure).toBe(false);
  });

  it("falls back to NODE_ENV=production when AUTH_COOKIE_SECURE is unset", async () => {
    Object.assign(process.env, { ...BASE_ENV, NODE_ENV: "production" });
    const { getAuthConfig } = await import("./config");

    expect(getAuthConfig().cookieSecure).toBe(true);
  });

  it("is false when NODE_ENV is not production and AUTH_COOKIE_SECURE is unset", async () => {
    Object.assign(process.env, { ...BASE_ENV, NODE_ENV: "test" });
    const { getAuthConfig } = await import("./config");

    expect(getAuthConfig().cookieSecure).toBe(false);
  });
});

describe("getAuthConfig required env vars", () => {
  it("throws when APP_PUBLIC_URL is missing", async () => {
    Object.assign(process.env, BASE_ENV);
    delete process.env.APP_PUBLIC_URL;
    const { getAuthConfig } = await import("./config");

    expect(() => getAuthConfig()).toThrow("APP_PUBLIC_URL");
  });

  it("throws when OIDC_ISSUER_URL is missing", async () => {
    Object.assign(process.env, BASE_ENV);
    delete process.env.OIDC_ISSUER_URL;
    const { getAuthConfig } = await import("./config");

    expect(() => getAuthConfig()).toThrow("OIDC_ISSUER_URL");
  });

  it("throws when OIDC_CLIENT_ID is missing", async () => {
    Object.assign(process.env, BASE_ENV);
    delete process.env.OIDC_CLIENT_ID;
    const { getAuthConfig } = await import("./config");

    expect(() => getAuthConfig()).toThrow("OIDC_CLIENT_ID");
  });

  it("throws when AUTH_SESSION_SECRET is missing", async () => {
    Object.assign(process.env, BASE_ENV);
    delete process.env.AUTH_SESSION_SECRET;
    const { getAuthConfig } = await import("./config");

    expect(() => getAuthConfig()).toThrow("AUTH_SESSION_SECRET");
  });
});
