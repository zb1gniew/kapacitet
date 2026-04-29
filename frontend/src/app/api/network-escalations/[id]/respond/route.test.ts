import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("network escalation respond route", () => {
  it("posts a response to the backend", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ saved: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(
      new Request("https://app.example/api/network-escalations/42/respond", {
        method: "POST",
        body: JSON.stringify({ available: true }),
      }),
      { params: Promise.resolve({ id: "42" }) },
    );

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/network-escalations/42/respond",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ available: true }),
      },
    );
    await expect(response.json()).resolves.toEqual({ saved: true });
  });

  it("returns a friendly error on unexpected failures", async () => {
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await POST(
      new Request("https://app.example/api/network-escalations/42/respond", {
        method: "POST",
        body: JSON.stringify({ available: true }),
      }),
      { params: Promise.resolve({ id: "42" }) },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to submit the network response right now.",
    });
  });
});
