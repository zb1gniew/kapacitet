import { OIDC_SCOPES_DEFAULT } from "@/constants/auth";

export type AuthConfig = {
  appUrl: string;
  issuerUrl: string;
  serverIssuerUrl: string;
  clientId: string;
  clientSecret?: string;
  scopes: string;
  sessionSecret: string;
  cookieSecure: boolean;
};

let cachedConfig: AuthConfig | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function parseBooleanEnv(value: string | undefined): boolean | null {
  if (value === undefined) {
    return null;
  }

  if (value.toLowerCase() === "true") {
    return true;
  }

  if (value.toLowerCase() === "false") {
    return false;
  }

  return null;
}

export function getAuthConfig(): AuthConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const secureFromEnv = parseBooleanEnv(process.env.AUTH_COOKIE_SECURE);
  const issuerUrl = normalizeUrl(getRequiredEnv("OIDC_ISSUER_URL"));
  const serverIssuerUrl = normalizeUrl(
    process.env.OIDC_SERVER_ISSUER_URL || issuerUrl,
  );

  cachedConfig = {
    appUrl: normalizeUrl(getRequiredEnv("APP_PUBLIC_URL")),
    issuerUrl,
    serverIssuerUrl,
    clientId: getRequiredEnv("OIDC_CLIENT_ID"),
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    scopes: process.env.OIDC_SCOPES || OIDC_SCOPES_DEFAULT,
    sessionSecret: getRequiredEnv("AUTH_SESSION_SECRET"),
    cookieSecure: secureFromEnv ?? process.env.NODE_ENV === "production",
  };

  return cachedConfig;
}
