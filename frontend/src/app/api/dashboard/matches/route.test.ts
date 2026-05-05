import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("dashboard matches route", () => {
  it("returns backend json and handles failures", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 3 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET();
    await expect(response.json()).resolves.toEqual([{ id: 3 }]);

    mockedFetchBackend.mockRejectedValueOnce(new Error("offline"));
    const failed = await GET();
    expect(failed.status).toBe(500);
    await expect(failed.json()).resolves.toEqual({
      message: "Unable to load match offers right now.",
    });
  });

  it("proxies a non-ok backend response", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response("Forbidden", {
        status: 403,
        headers: { "content-type": "text/plain" },
      }),
    );

    const response = await GET();
    expect(response.status).toBe(403);
    await expect(response.text()).resolves.toBe("Forbidden");
  });
});
