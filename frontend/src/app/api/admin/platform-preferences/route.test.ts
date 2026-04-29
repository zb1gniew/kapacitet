import { describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("admin platform preferences route", () => {
  it("proxies the get request to the backend", async () => {
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
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to load platform preferences right now.",
    });
  });
});
