import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("availability hints route", () => {
  it("proxies the request payload to the backend", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ estimatedMatchCount: 2, hints: ["b"] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(
      new Request("https://app.example/api/workflows/availability-hints", {
        method: "POST",
        body: JSON.stringify({ quantity: 2 }),
      }) as never,
    );

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/availability/hints",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quantity: 2 }),
      },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      estimatedMatchCount: 2,
      hints: ["b"],
    });
  });

  it("returns the fallback payload when the backend call fails", async () => {
    mockedFetchBackend.mockRejectedValue(new Error("backend unavailable"));

    const response = await POST(
      new Request("https://app.example/api/workflows/availability-hints", {
        method: "POST",
        body: JSON.stringify({ quantity: 2 }),
      }) as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      estimatedMatchCount: 0,
      hints: [],
    });
  });
});
