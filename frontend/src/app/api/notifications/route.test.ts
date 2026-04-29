import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("notifications route", () => {
  it("returns backend notifications and proxies backend errors", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const ok = await GET();
    await expect(ok.json()).resolves.toEqual([{ id: 1 }]);

    mockedFetchBackend.mockResolvedValueOnce(
      new Response("forbidden", {
        status: 403,
        headers: { "content-type": "text/plain" },
      }),
    );
    const proxied = await GET();
    expect(proxied.status).toBe(403);
    await expect(proxied.text()).resolves.toBe("forbidden");
  });
});
