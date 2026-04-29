import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("notifications read-all route", () => {
  it("marks all notifications as read", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST();

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/notifications/read-all",
      {
        method: "POST",
      },
    );
    expect(response.status).toBe(200);
  });

  it("returns a friendly error when the backend call fails", async () => {
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to mark all notifications as read.",
    });
  });

  it("proxies backend error responses", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response("forbidden", {
        status: 403,
        headers: { "content-type": "text/plain" },
      }),
    );

    const response = await POST();

    expect(response.status).toBe(403);
    await expect(response.text()).resolves.toBe("forbidden");
  });
});
