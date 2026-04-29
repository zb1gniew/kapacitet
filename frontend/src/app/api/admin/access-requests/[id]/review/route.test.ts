import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("admin access request review route", () => {
  it("posts the review payload to the backend", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ reviewed: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(
      new Request("https://app.example/api/admin/access-requests/1/review", {
        method: "POST",
        body: JSON.stringify({ decision: "approve" }),
      }) as never,
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/AccessRequest/1/review",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "approve" }),
      },
    );
    await expect(response.json()).resolves.toEqual({ reviewed: true });
  });

  it("returns a friendly error on unexpected failures", async () => {
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await POST(
      new Request("https://app.example/api/admin/access-requests/1/review", {
        method: "POST",
        body: JSON.stringify({ decision: "approve" }),
      }) as never,
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to process review right now.",
    });
  });
});
