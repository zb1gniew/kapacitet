import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("admin access requests route", () => {
  it("proxies access requests from the backend", async () => {
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
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to load access requests right now.",
    });
  });
});
