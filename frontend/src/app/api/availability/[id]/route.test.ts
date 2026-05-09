import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("availability by id route", () => {
  it("proxies the backend response body and content type", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 12, status: "Active" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "12" }),
    });

    expect(mockedFetchBackend).toHaveBeenCalledWith("/api/availability/12", {
      method: "GET",
    });
    await expect(response.json()).resolves.toEqual({
      id: 12,
      status: "Active",
    });
  });

  it("still returns the backend body and status when the backend omits content type", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response('{"message":"raw"}', {
        status: 404,
      }),
    );

    const response = await GET(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "44" }),
    });

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe('{"message":"raw"}');
  });

  it("returns a friendly error when the backend call throws", async () => {
    mockedFetchBackend.mockRejectedValueOnce(new Error("offline"));

    const response = await GET(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "55" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to load availability right now.",
    });
  });
});
