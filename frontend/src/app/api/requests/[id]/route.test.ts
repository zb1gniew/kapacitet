import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("capacity request by id route", () => {
  it("loads a request from the backend", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 8, quantity: 3 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "8" }),
    });

    expect(mockedFetchBackend).toHaveBeenCalledWith("/api/requests/8", {
      method: "GET",
    });
    await expect(response.json()).resolves.toEqual({ id: 8, quantity: 3 });
  });

  it("preserves non-ok backend responses", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response("Missing", {
        status: 404,
        headers: { "content-type": "text/plain" },
      }),
    );

    const response = await GET(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "404" }),
    });

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe("Missing");
  });

  it("returns a friendly error when the backend call throws", async () => {
    mockedFetchBackend.mockRejectedValueOnce(new Error("offline"));

    const response = await GET(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "8" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to load the capacity request right now.",
    });
  });
});
