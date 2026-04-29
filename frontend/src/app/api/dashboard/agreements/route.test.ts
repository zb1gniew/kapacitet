import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("dashboard agreements route", () => {
  it("returns backend json and proxies non-ok responses", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 4 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const ok = await GET();
    await expect(ok.json()).resolves.toEqual([{ id: 4 }]);

    mockedFetchBackend.mockResolvedValueOnce(
      new Response("nope", {
        status: 503,
        headers: { "content-type": "text/plain" },
      }),
    );

    const proxied = await GET();
    expect(proxied.status).toBe(503);
    await expect(proxied.text()).resolves.toBe("nope");
  });
});
