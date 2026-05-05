import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("supplier confirm route", () => {
  it("posts supplier confirmation to the backend", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ confirmed: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "7" }),
    });

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/matches/7/supplier-confirm",
      { method: "POST" },
    );
    await expect(response.json()).resolves.toEqual({ confirmed: true });
  });

  it("proxies a non-ok backend response", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ detail: "Capacity exhausted" }), {
        status: 409,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "7" }),
    });

    expect(response.status).toBe(409);
  });

  it("returns a friendly error when the backend call throws", async () => {
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "7" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to confirm the offer right now.",
    });
  });
});
