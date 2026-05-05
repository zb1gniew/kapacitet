import { describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";
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

describe("admin platform preferences route", () => {
  it("returns 403 on GET when caller is not a platform admin", async () => {
    mockedGetServerAuthSession.mockResolvedValue({
      user: { sub: "user-1", appRole: "Manager" },
      accessToken: "token",
      expiresAt: 9999999999,
    } as never);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(mockedFetchBackend).not.toHaveBeenCalled();
  });

  it("returns 403 on PUT when caller is not a platform admin", async () => {
    mockedGetServerAuthSession.mockResolvedValue({
      user: { sub: "user-1", appRole: "Manager" },
      accessToken: "token",
      expiresAt: 9999999999,
    } as never);

    const response = await PUT(
      new Request("https://app.example/api/admin/platform-preferences", {
        method: "PUT",
        body: JSON.stringify({ notifyAdmins: false }),
      }) as never,
    );

    expect(response.status).toBe(403);
    expect(mockedFetchBackend).not.toHaveBeenCalled();
  });

  it("proxies the get request to the backend", async () => {
    mockedGetServerAuthSession.mockResolvedValue(platformAdminSession);
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ notifyAdmins: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET();

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/admin/preferences/platform",
      {
        method: "GET",
      },
    );
    await expect(response.json()).resolves.toEqual({ notifyAdmins: true });
  });

  it("proxies the put request to the backend", async () => {
    mockedGetServerAuthSession.mockResolvedValue(platformAdminSession);
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ saved: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await PUT(
      new Request("https://app.example/api/admin/platform-preferences", {
        method: "PUT",
        body: JSON.stringify({ notifyAdmins: false }),
      }) as never,
    );

    expect(mockedFetchBackend).toHaveBeenLastCalledWith(
      "/api/admin/preferences/platform",
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notifyAdmins: false }),
      },
    );
    await expect(response.json()).resolves.toEqual({ saved: true });
  });

  it("returns a friendly error on unexpected failures", async () => {
    mockedGetServerAuthSession.mockResolvedValue(platformAdminSession);
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to load platform preferences right now.",
    });
  });
});
