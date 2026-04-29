import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("catalog certificates route", () => {
  it("returns cached certificate catalog data", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify([{ id: 10, name: "Lift license" }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET();

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/catalog/certificates",
      {
        method: "GET",
        cache: "force-cache",
      },
    );
    expect(response.headers.get("cache-control")).toBe("private, max-age=3600");
    await expect(response.json()).resolves.toEqual([
      { id: 10, name: "Lift license" },
    ]);
  });

  it("returns a friendly error on unexpected failures", async () => {
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to load certificates right now.",
    });
  });
});
