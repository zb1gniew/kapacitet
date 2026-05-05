import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("match accept route", () => {
  it("posts acceptance to the backend", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "7" }),
    });

    expect(mockedFetchBackend).toHaveBeenCalledWith("/api/matches/7/accept", {
      method: "POST",
    });
    await expect(response.json()).resolves.toEqual({ accepted: true });
  });

  it("proxies non-ok backend responses with their status and body", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response("Conflict", {
        status: 409,
        headers: { "content-type": "text/plain" },
      }),
    );

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "7" }),
    });

    expect(response.status).toBe(409);
    await expect(response.text()).resolves.toBe("Conflict");
  });

  it("returns a friendly error when the backend call throws", async () => {
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "7" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to accept the offer right now.",
    });
  });
});
