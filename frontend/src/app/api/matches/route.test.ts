import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("matches route", () => {
  it("returns backend matches and handles errors", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const ok = await GET();
    await expect(ok.json()).resolves.toEqual([{ id: 1 }]);

    mockedFetchBackend.mockRejectedValueOnce(new Error("offline"));
    const failed = await GET();
    expect(failed.status).toBe(500);
    await expect(failed.json()).resolves.toEqual({
      message: "Unable to load matches right now.",
    });
  });

  it("proxies a non-ok backend response", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response("Unauthorized", {
        status: 401,
        headers: { "content-type": "text/plain" },
      }),
    );

    const response = await GET();
    expect(response.status).toBe(401);
    await expect(response.text()).resolves.toBe("Unauthorized");
  });
});
