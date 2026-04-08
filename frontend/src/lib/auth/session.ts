import { EncryptJWT, jwtDecrypt } from "jose";
import {
  AUTH_COOKIE_PATH,
  AUTH_SESSION_DEFAULT_MAX_AGE_SECONDS,
  AUTH_TRANSACTION_MAX_AGE_SECONDS,
} from "@/constants/auth";
import type { AuthTransaction } from "@/types/auth";
import { getAuthConfig } from "./config";

type AuthSessionReference = {
  sessionId: string;
};

type TokenPayload<T> = {
  type: "session_ref" | "transaction";
  data: T;
};

async function buildEncryptionKey(secret: string): Promise<Uint8Array> {
  const encodedSecret = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", encodedSecret);
  return new Uint8Array(digest);
}

async function encryptPayload<T>(
  payload: TokenPayload<T>,
  maxAgeSeconds: number,
): Promise<string> {
  const { sessionSecret } = getAuthConfig();
  const key = await buildEncryptionKey(sessionSecret);

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
    const key = await buildEncryptionKey(sessionSecret);
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
  sessionId: string,
  maxAgeSeconds = AUTH_SESSION_DEFAULT_MAX_AGE_SECONDS,
): Promise<string> {
  return encryptPayload(
    { type: "session_ref", data: { sessionId } },
    maxAgeSeconds,
  );
}

export async function parseSessionCookieValue(
  value: string,
): Promise<string | null> {
  const sessionReference = await decryptPayload<AuthSessionReference>(
    value,
    "session_ref",
  );

  return sessionReference?.sessionId ?? null;
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
