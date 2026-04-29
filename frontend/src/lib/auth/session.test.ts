import { describe, expect, it } from "vitest";
import {
  createSessionCookieValue,
  createTransactionCookieValue,
  getSessionCookieOptions,
  getTransactionCookieOptions,
  parseSessionCookieValue,
  parseTransactionCookieValue,
} from "./session";

process.env.APP_PUBLIC_URL = "https://app.example";
process.env.OIDC_ISSUER_URL = "https://issuer.example/realms/kapacitet";
process.env.OIDC_CLIENT_ID = "frontend";
process.env.AUTH_SESSION_SECRET = "super-secret-session-key";
process.env.NODE_ENV = "test";

describe("session cookie helpers", () => {
  it("round-trips encrypted session references", async () => {
    const cookie = await createSessionCookieValue("session-123", 300);

    await expect(parseSessionCookieValue(cookie)).resolves.toBe("session-123");
  });

  it("round-trips encrypted auth transactions", async () => {
    const transaction = {
      state: "state-1",
      codeVerifier: "verifier-1",
      nonce: "nonce-1",
      returnTo: "/dashboard",
    };
    const cookie = await createTransactionCookieValue(transaction);

    await expect(parseTransactionCookieValue(cookie)).resolves.toEqual(
      transaction,
    );
    await expect(parseSessionCookieValue(cookie)).resolves.toBeNull();
  });

  it("returns secure cookie option objects for session and transaction cookies", () => {
    expect(getSessionCookieOptions(true, 900)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 900,
    });
    expect(getTransactionCookieOptions(false)).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  });
});
