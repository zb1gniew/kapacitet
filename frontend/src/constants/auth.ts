export const AUTH_COOKIE_NAMES = {
  session: "kapacitet.session",
  transaction: "kapacitet.auth_tx",
} as const;

export const AUTH_COOKIE_PATH = "/";
export const AUTH_TRANSACTION_MAX_AGE_SECONDS = 10 * 60;
export const AUTH_SESSION_DEFAULT_MAX_AGE_SECONDS = 60 * 60;
export const AUTH_SESSION_REFRESH_WINDOW_SECONDS = 60;

export const OIDC_SCOPES_DEFAULT = "openid profile email offline_access";
