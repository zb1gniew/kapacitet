import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redisMock = vi.hoisted(() => ({
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
}));

vi.mock("ioredis", () => {
  class Redis {
    set: typeof redisMock.set;
    get: typeof redisMock.get;
    del: typeof redisMock.del;
    constructor() {
      this.set = redisMock.set;
      this.get = redisMock.get;
      this.del = redisMock.del;
    }
  }
  return { Redis };
});

// Reset the module so the Redis singleton is recreated per test group
afterEach(() => {
  delete process.env.REDIS_URL;
  vi.resetModules();
  vi.clearAllMocks();
});

const NOW_SECONDS = 1_777_370_400;

function mockNow() {
  vi.spyOn(Date, "now").mockReturnValue(NOW_SECONDS * 1000);
}

function setRedisUrl() {
  process.env.REDIS_URL = "redis://redis:6379";
}

const SESSION = {
  user: { sub: "user-1", email: "user@example.com" },
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresAt: NOW_SECONDS + 300,
  refreshExpiresAt: NOW_SECONDS + 1800,
};

describe("createServerSession", () => {
  beforeEach(() => {
    mockNow();
    setRedisUrl();
  });

  it("stores the session in Redis with the correct TTL and returns a UUID", async () => {
    redisMock.set.mockResolvedValue("OK");
    const { createServerSession } = await import("./session-store");

    const id = await createServerSession(SESSION);

    expect(typeof id).toBe("string");
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(redisMock.set).toHaveBeenCalledWith(
      `kapacitet:session:${id}`,
      JSON.stringify(SESSION),
      "EX",
      1800, // refreshExpiresAt - now
    );
  });

  it("uses expiresAt when refreshExpiresAt is not present", async () => {
    redisMock.set.mockResolvedValue("OK");
    const { createServerSession } = await import("./session-store");
    const session = { ...SESSION, refreshExpiresAt: undefined };

    await createServerSession(session);

    const [, , , ttl] = redisMock.set.mock.calls[0] as unknown[];
    expect(ttl).toBe(300); // expiresAt - now
  });
});

describe("getServerSession", () => {
  beforeEach(() => {
    mockNow();
    setRedisUrl();
  });

  it("returns null when the key does not exist in Redis", async () => {
    redisMock.get.mockResolvedValue(null);
    const { getServerSession } = await import("./session-store");

    await expect(getServerSession("missing-id")).resolves.toBeNull();
  });

  it("returns the parsed session for a valid, non-expired key", async () => {
    redisMock.get.mockResolvedValue(JSON.stringify(SESSION));
    const { getServerSession } = await import("./session-store");

    await expect(getServerSession("session-uuid")).resolves.toEqual(SESSION);
  });

  it("deletes and returns null when the session has expired", async () => {
    const expired = {
      ...SESSION,
      expiresAt: NOW_SECONDS - 1,
      refreshExpiresAt: NOW_SECONDS - 1,
    };
    redisMock.get.mockResolvedValue(JSON.stringify(expired));
    redisMock.del.mockResolvedValue(1);
    const { getServerSession } = await import("./session-store");

    await expect(getServerSession("session-uuid")).resolves.toBeNull();
    expect(redisMock.del).toHaveBeenCalledWith(
      "kapacitet:session:session-uuid",
    );
  });
});

describe("updateServerSession", () => {
  beforeEach(() => {
    mockNow();
    setRedisUrl();
  });

  it("overwrites the stored session with a new TTL", async () => {
    redisMock.set.mockResolvedValue("OK");
    const { updateServerSession } = await import("./session-store");
    const updated = { ...SESSION, accessToken: "new-token" };

    await updateServerSession("session-uuid", updated);

    expect(redisMock.set).toHaveBeenCalledWith(
      "kapacitet:session:session-uuid",
      JSON.stringify(updated),
      "EX",
      1800,
    );
  });
});

describe("deleteServerSession", () => {
  beforeEach(setRedisUrl);

  it("removes the key from Redis", async () => {
    redisMock.del.mockResolvedValue(1);
    const { deleteServerSession } = await import("./session-store");

    await deleteServerSession("session-uuid");

    expect(redisMock.del).toHaveBeenCalledWith(
      "kapacitet:session:session-uuid",
    );
  });
});

describe("REDIS_URL configuration", () => {
  it("fails fast when REDIS_URL is missing", async () => {
    const { createServerSession } = await import("./session-store");

    await expect(createServerSession(SESSION)).rejects.toThrow(
      "Missing required environment variable: REDIS_URL",
    );
  });
});
