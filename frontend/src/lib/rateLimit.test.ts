import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "./rateLimit";

function makeRequest(ip: string) {
  return new NextRequest("https://app.example/api/auth/login", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows requests under the limit", async () => {
    const req = makeRequest("1.2.3.4");
    await expect(checkRateLimit(req, "login", 3, 60_000)).resolves.toBeNull();
    await expect(checkRateLimit(req, "login", 3, 60_000)).resolves.toBeNull();
    await expect(checkRateLimit(req, "login", 3, 60_000)).resolves.toBeNull();
  });

  it("returns 429 once the limit is exceeded", async () => {
    const req = makeRequest("2.2.2.2");
    await checkRateLimit(req, "exceed", 2, 60_000);
    await checkRateLimit(req, "exceed", 2, 60_000);

    const response = await checkRateLimit(req, "exceed", 2, 60_000);
    expect(response?.status).toBe(429);
  });

  it("resets the counter after the window expires", async () => {
    const req = makeRequest("3.3.3.3");
    await checkRateLimit(req, "reset", 1, 5_000);
    expect((await checkRateLimit(req, "reset", 1, 5_000))?.status).toBe(429);

    vi.advanceTimersByTime(6_000);

    await expect(checkRateLimit(req, "reset", 1, 5_000)).resolves.toBeNull();
  });

  it("counts different keys independently", async () => {
    const req = makeRequest("4.4.4.4");
    await checkRateLimit(req, "key-a", 1, 60_000);
    expect((await checkRateLimit(req, "key-a", 1, 60_000))?.status).toBe(429);

    await expect(checkRateLimit(req, "key-b", 1, 60_000)).resolves.toBeNull();
  });

  it("counts different IPs independently", async () => {
    const req1 = makeRequest("10.0.0.1");
    const req2 = makeRequest("10.0.0.2");
    await checkRateLimit(req1, "ip-test", 1, 60_000);
    expect((await checkRateLimit(req1, "ip-test", 1, 60_000))?.status).toBe(
      429,
    );

    await expect(
      checkRateLimit(req2, "ip-test", 1, 60_000),
    ).resolves.toBeNull();
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    const req = new NextRequest("https://app.example/api/auth/login", {
      headers: { "x-real-ip": "5.5.5.5" },
    });
    await expect(checkRateLimit(req, "real-ip", 1, 60_000)).resolves.toBeNull();
    expect((await checkRateLimit(req, "real-ip", 1, 60_000))?.status).toBe(429);
  });
});
