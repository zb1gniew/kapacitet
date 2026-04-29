import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("catalog skills route", () => {
  it("returns cached skill catalog data", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, name: "Roofing" }]), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "public, max-age=600",
        },
      }),
    );

    const response = await GET();

    expect(mockedFetchBackend).toHaveBeenCalledWith("/api/catalog/skills", {
      method: "GET",
      cache: "force-cache",
    });
    expect(response.headers.get("cache-control")).toBe("public, max-age=600");
    await expect(response.json()).resolves.toEqual([{ id: 1, name: "Roofing" }]);
  });

  it("returns a friendly error on unexpected failures", async () => {
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to load skills right now.",
    });
  });
});
