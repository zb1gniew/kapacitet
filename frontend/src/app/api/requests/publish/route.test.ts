import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("requests publish route", () => {
  it("proxies publish payloads to the backend", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ id: 2, status: "Active" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(
      new Request("https://app.example/api/requests/publish", {
        method: "POST",
        body: JSON.stringify({ quantity: 4 }),
      }) as never,
    );

    expect(mockedFetchBackend).toHaveBeenCalledWith("/api/requests/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quantity: 4 }),
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: 2, status: "Active" });
  });

  it("returns a friendly error when publish fails unexpectedly", async () => {
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await POST(
      new Request("https://app.example/api/requests/publish", {
        method: "POST",
        body: JSON.stringify({ quantity: 4 }),
      }) as never,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to publish the capacity request right now.",
    });
  });
});
