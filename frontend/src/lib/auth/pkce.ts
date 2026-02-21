import { createHash, randomBytes } from "crypto";

function toBase64Url(value: Buffer): string {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createRandomState(): string {
  return toBase64Url(randomBytes(32));
}

export function createCodeVerifier(): string {
  return toBase64Url(randomBytes(64));
}

export function createCodeChallenge(codeVerifier: string): string {
  const digest = createHash("sha256").update(codeVerifier).digest();
  return toBase64Url(digest);
}
