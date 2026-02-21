import { createHash } from "crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import {
  AUTH_COOKIE_PATH,
  AUTH_SESSION_DEFAULT_MAX_AGE_SECONDS,
  AUTH_TRANSACTION_MAX_AGE_SECONDS,
} from "@/constants/auth";
import type { AuthSession, AuthTransaction } from "@/types/auth";
import { getAuthConfig } from "./config";

type TokenPayload<T> = {
  type: "session" | "transaction";
  data: T;
};

function buildEncryptionKey(secret: string): Uint8Array {
  return createHash("sha256").update(secret, "utf8").digest();
}

async function encryptPayload<T>(
  payload: TokenPayload<T>,
  maxAgeSeconds: number,
): Promise<string> {
  const { sessionSecret } = getAuthConfig();
  const key = buildEncryptionKey(sessionSecret);

  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .encrypt(key);
}

async function decryptPayload<T>(
  value: string,
  expectedType: TokenPayload<T>["type"],
): Promise<T | null> {
  try {
    const { sessionSecret } = getAuthConfig();
    const key = buildEncryptionKey(sessionSecret);
    const result = await jwtDecrypt<TokenPayload<T>>(value, key, {
      clockTolerance: 5,
    });

    if (result.payload.type !== expectedType) {
      return null;
    }

    return result.payload.data;
  } catch {
    return null;
  }
}

export async function createSessionCookieValue(
  session: AuthSession,
): Promise<string> {
  const sessionMaxAge =
    session.refreshExpiresAt && session.refreshExpiresAt > 0
      ? Math.max(
          AUTH_SESSION_DEFAULT_MAX_AGE_SECONDS,
          session.refreshExpiresAt - Math.floor(Date.now() / 1000),
        )
      : AUTH_SESSION_DEFAULT_MAX_AGE_SECONDS;

  return encryptPayload({ type: "session", data: session }, sessionMaxAge);
}

export async function parseSessionCookieValue(
  value: string,
): Promise<AuthSession | null> {
  return decryptPayload<AuthSession>(value, "session");
}

export async function createTransactionCookieValue(
  transaction: AuthTransaction,
): Promise<string> {
  return encryptPayload(
    { type: "transaction", data: transaction },
    AUTH_TRANSACTION_MAX_AGE_SECONDS,
  );
}

export async function parseTransactionCookieValue(
  value: string,
): Promise<AuthTransaction | null> {
  return decryptPayload<AuthTransaction>(value, "transaction");
}

export function getSessionCookieOptions(
  secure: boolean,
  maxAgeSeconds = AUTH_SESSION_DEFAULT_MAX_AGE_SECONDS,
) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: AUTH_COOKIE_PATH,
    maxAge: maxAgeSeconds,
  };
}

export function getTransactionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: AUTH_COOKIE_PATH,
    maxAge: AUTH_TRANSACTION_MAX_AGE_SECONDS,
  };
}
