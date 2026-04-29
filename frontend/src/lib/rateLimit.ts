import { NextRequest, NextResponse } from "next/server";

type RateLimitEntry = { count: number; resetAt: number };

const store = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function checkRateLimit(
  request: NextRequest,
  key: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const ip = getClientIp(request);
  const storeKey = `${key}:${ip}`;
  const now = Date.now();

  const entry = store.get(storeKey);

  if (!entry || entry.resetAt <= now) {
    store.set(storeKey, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= limit) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  entry.count += 1;
  return null;
}
