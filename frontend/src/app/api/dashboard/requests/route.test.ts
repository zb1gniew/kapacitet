import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("dashboard requests route", () => {
  it("returns backend json on success", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify([{ id: 2 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET();

    expect(mockedFetchBackend).toHaveBeenCalledWith("/api/requests", {
      method: "GET",
    });
    await expect(response.json()).resolves.toEqual([{ id: 2 }]);
  });

  it("proxies backend errors", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ message: "bad request" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "bad request" });
  });
});
