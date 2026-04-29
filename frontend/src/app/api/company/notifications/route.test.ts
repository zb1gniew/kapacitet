import { describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("company notifications route", () => {
  it("proxies notification preference reads and writes", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify({ email: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const getResponse = await GET();
    await expect(getResponse.json()).resolves.toEqual({ email: true });

    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify({ saved: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const putResponse = await PUT(
      new Request("https://app.example/api/company/notifications", {
        method: "PUT",
        body: JSON.stringify({ email: false }),
      }) as never,
    );
    expect(mockedFetchBackend).toHaveBeenLastCalledWith(
      "/api/company/notifications",
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: false }),
      },
    );
    await expect(putResponse.json()).resolves.toEqual({ saved: true });
  });
});
