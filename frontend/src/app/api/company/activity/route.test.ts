import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("company activity route", () => {
  it("forwards the limit query param to the backend", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET(
      new NextRequest("https://app.example/api/company/activity?limit=25"),
    );

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/company/activity?limit=25",
      { method: "GET" },
    );
    await expect(response.json()).resolves.toEqual([{ id: 1 }]);
  });

  it("uses the default limit and returns a friendly error on failures", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    await GET(new NextRequest("https://app.example/api/company/activity"));
    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/company/activity?limit=10",
      { method: "GET" },
    );

    mockedFetchBackend.mockRejectedValueOnce(new Error("offline"));
    const failed = await GET(
      new NextRequest("https://app.example/api/company/activity"),
    );
    expect(failed.status).toBe(500);
    await expect(failed.json()).resolves.toEqual({
      message: "Unable to load activity log right now.",
    });
  });
});
