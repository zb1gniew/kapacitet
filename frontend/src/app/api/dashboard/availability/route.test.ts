import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("dashboard availability route", () => {
  it("returns backend json on success", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET();

    expect(mockedFetchBackend).toHaveBeenCalledWith("/api/availability", {
      method: "GET",
    });
    await expect(response.json()).resolves.toEqual([{ id: 1 }]);
  });

  it("proxies backend errors and handles thrown failures", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response("backend error", {
        status: 502,
        headers: { "content-type": "text/plain" },
      }),
    );

    const proxied = await GET();
    expect(proxied.status).toBe(502);
    await expect(proxied.text()).resolves.toBe("backend error");

    mockedFetchBackend.mockRejectedValueOnce(new Error("offline"));
    const failed = await GET();
    expect(failed.status).toBe(500);
    await expect(failed.json()).resolves.toEqual({
      message: "Unable to load availability right now.",
    });
  });
});
