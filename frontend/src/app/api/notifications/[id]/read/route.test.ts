import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("notification read route", () => {
  it("posts the notification id to the backend and returns an empty body", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "42" }),
    });

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/notifications/42/read",
      {
        method: "POST",
      },
    );
    expect(response.status).toBe(200);
  });

  it("returns a friendly error on unexpected failures", async () => {
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "42" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to mark notification as read.",
    });
  });

  it("proxies backend error responses", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response("forbidden", {
        status: 403,
        headers: { "content-type": "text/plain" },
      }),
    );

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "42" }),
    });

    expect(response.status).toBe(403);
    await expect(response.text()).resolves.toBe("forbidden");
  });
});
