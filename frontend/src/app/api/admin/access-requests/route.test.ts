import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";
import { getServerAuthSession } from "@/lib/auth/server-session";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

vi.mock("@/lib/auth/server-session", () => ({
  getServerAuthSession: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);
const mockedGetServerAuthSession = vi.mocked(getServerAuthSession);

const platformAdminSession = {
  user: { sub: "admin-1", roles: ["Admin"] },
  accessToken: "token",
  expiresAt: 9999999999,
} as never;

describe("admin access requests route", () => {
  it("returns 403 when caller is not a platform admin", async () => {
    mockedGetServerAuthSession.mockResolvedValue({
      user: { sub: "user-1", appRole: "Manager" },
      accessToken: "token",
      expiresAt: 9999999999,
    } as never);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(mockedFetchBackend).not.toHaveBeenCalled();
  });

  it("proxies access requests from the backend", async () => {
    mockedGetServerAuthSession.mockResolvedValue(platformAdminSession);
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET();

    expect(mockedFetchBackend).toHaveBeenCalledWith("/api/AccessRequest", {
      method: "GET",
    });
    await expect(response.json()).resolves.toEqual([{ id: 1 }]);
  });

  it("returns a friendly error on unexpected failures", async () => {
    mockedGetServerAuthSession.mockResolvedValue(platformAdminSession);
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to load access requests right now.",
    });
  });
});
