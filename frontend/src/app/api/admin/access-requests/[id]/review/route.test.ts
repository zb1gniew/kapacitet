import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
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

const reviewRequest = (id = "1") =>
  new Request(`https://app.example/api/admin/access-requests/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ decision: "approve" }),
  }) as never;

describe("admin access request review route", () => {
  it("returns 403 when caller is not a platform admin", async () => {
    mockedGetServerAuthSession.mockResolvedValue({
      user: { sub: "user-1", appRole: "Manager" },
      accessToken: "token",
      expiresAt: 9999999999,
    } as never);

    const response = await POST(reviewRequest(), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(403);
    expect(mockedFetchBackend).not.toHaveBeenCalled();
  });

  it("posts the review payload to the backend", async () => {
    mockedGetServerAuthSession.mockResolvedValue(platformAdminSession);
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ reviewed: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(reviewRequest(), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/AccessRequest/1/review",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "approve" }),
      },
    );
    await expect(response.json()).resolves.toEqual({ reviewed: true });
  });

  it("returns a friendly error on unexpected failures", async () => {
    mockedGetServerAuthSession.mockResolvedValue(platformAdminSession);
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await POST(reviewRequest(), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to process review right now.",
    });
  });
});
