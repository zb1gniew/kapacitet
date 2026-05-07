import { Redis } from "ioredis";
import { NextRequest, NextResponse } from "next/server";

type RateLimitEntry = { count: number; resetAt: number };

const store = new Map<string, RateLimitEntry>();
let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis(redisUrl, {
    lazyConnect: false,
    enableReadyCheck: true,
  });

  return redisClient;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function createRateLimitResponse(): NextResponse {
  return NextResponse.json(
    { message: "Too many requests. Please try again later." },
    { status: 429 },
  );
}

function checkRateLimitInMemory(
  storeKey: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const now = Date.now();

  const entry = store.get(storeKey);

  if (!entry || entry.resetAt <= now) {
    store.set(storeKey, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= limit) {
    return createRateLimitResponse();
  }

  entry.count += 1;
  return null;
}

async function checkRateLimitInRedis(
  storeKey: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const redis = getRedis();
  if (!redis) {
    return checkRateLimitInMemory(storeKey, limit, windowMs);
  }

  try {
    const count = await redis.incr(storeKey);
    if (count === 1) {
      await redis.pexpire(storeKey, windowMs);
    }

    return count > limit ? createRateLimitResponse() : null;
  } catch {
    return checkRateLimitInMemory(storeKey, limit, windowMs);
  }
}

export async function checkRateLimit(
  request: NextRequest,
  key: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const storeKey = `${key}:${ip}`;
  return checkRateLimitInRedis(storeKey, limit, windowMs);
}
