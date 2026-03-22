import { randomUUID } from "crypto";
import type { AuthSession } from "@/types/auth";

type StoredSession = {
  session: AuthSession;
  updatedAt: number;
};

type SessionStore = Map<string, StoredSession>;

declare global {
  var __kapacitetAuthSessionStore: SessionStore | undefined;
}

function getSessionStore(): SessionStore {
  if (!globalThis.__kapacitetAuthSessionStore) {
    globalThis.__kapacitetAuthSessionStore = new Map();
  }

  return globalThis.__kapacitetAuthSessionStore;
}

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function isStoredSessionExpired(storedSession: StoredSession): boolean {
  const { session } = storedSession;
  const cutoff = session.refreshExpiresAt ?? session.expiresAt;
  return cutoff <= nowInSeconds();
}

function pruneExpiredSessions(store: SessionStore) {
  for (const [sessionId, storedSession] of store.entries()) {
    if (isStoredSessionExpired(storedSession)) {
      store.delete(sessionId);
    }
  }
}

export async function createServerSession(
  session: AuthSession,
): Promise<string> {
  const store = getSessionStore();
  pruneExpiredSessions(store);

  const sessionId = randomUUID();
  store.set(sessionId, { session, updatedAt: Date.now() });

  return sessionId;
}

export async function getServerSession(
  sessionId: string,
): Promise<AuthSession | null> {
  const store = getSessionStore();
  const storedSession = store.get(sessionId);

  if (!storedSession) {
    return null;
  }

  if (isStoredSessionExpired(storedSession)) {
    store.delete(sessionId);
    return null;
  }

  return storedSession.session;
}

export async function updateServerSession(
  sessionId: string,
  session: AuthSession,
): Promise<void> {
  const store = getSessionStore();
  store.set(sessionId, { session, updatedAt: Date.now() });
}

export async function deleteServerSession(sessionId: string): Promise<void> {
  const store = getSessionStore();
  store.delete(sessionId);
}
