import { Redis } from "ioredis";
import type { AuthSession } from "@/types/auth";

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

let _redis: Redis | null = null;

function getRequiredRedisUrl(): string {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("Missing required environment variable: REDIS_URL");
  }

  return redisUrl;
}

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(getRequiredRedisUrl(), {
      lazyConnect: false,
      enableReadyCheck: true,
    });
  }
  return _redis;
}

function sessionKey(id: string) {
  return `kapacitet:session:${id}`;
}

function ttlSeconds(session: AuthSession): number {
  const cutoff = session.refreshExpiresAt ?? session.expiresAt;
  return Math.max(60, cutoff - nowInSeconds());
}

export async function createServerSession(
  session: AuthSession,
): Promise<string> {
  const sessionId = crypto.randomUUID();
  await getRedis().set(
    sessionKey(sessionId),
    JSON.stringify(session),
    "EX",
    ttlSeconds(session),
  );
  return sessionId;
}

export async function getServerSession(
  sessionId: string,
): Promise<AuthSession | null> {
  const raw = await getRedis().get(sessionKey(sessionId));
  if (!raw) {
    return null;
  }

  const session = JSON.parse(raw) as AuthSession;

  if ((session.refreshExpiresAt ?? session.expiresAt) <= nowInSeconds()) {
    await getRedis().del(sessionKey(sessionId));
    return null;
  }

  return session;
}

export async function updateServerSession(
  sessionId: string,
  session: AuthSession,
): Promise<void> {
  await getRedis().set(
    sessionKey(sessionId),
    JSON.stringify(session),
    "EX",
    ttlSeconds(session),
  );
}

export async function deleteServerSession(sessionId: string): Promise<void> {
  await getRedis().del(sessionKey(sessionId));
}
