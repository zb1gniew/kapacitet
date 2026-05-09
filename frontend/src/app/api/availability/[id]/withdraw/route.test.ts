import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("availability withdraw route", () => {
  it("posts withdraw requests to the backend", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "Cancelled" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "19" }),
    });

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/availability/19/withdraw",
      {
        method: "POST",
      },
    );
    await expect(response.json()).resolves.toEqual({ status: "Cancelled" });
  });

  it("proxies backend errors without changing the payload", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response("Conflict", {
        status: 409,
        headers: { "content-type": "text/plain" },
      }),
    );

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "19" }),
    });

    expect(response.status).toBe(409);
    await expect(response.text()).resolves.toBe("Conflict");
  });

  it("returns a friendly error when the backend call throws", async () => {
    mockedFetchBackend.mockRejectedValueOnce(new Error("offline"));

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "19" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to withdraw availability right now.",
    });
  });
});
