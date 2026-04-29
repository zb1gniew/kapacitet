import { describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("company settings route", () => {
  it("proxies get and put requests to the backend", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify({ visibility: "network" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const getResponse = await GET();
    await expect(getResponse.json()).resolves.toEqual({
      visibility: "network",
    });

    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify({ saved: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const putResponse = await PUT(
      new Request("https://app.example/api/company/settings", {
        method: "PUT",
        body: JSON.stringify({ visibility: "private" }),
      }) as never,
    );

    expect(mockedFetchBackend).toHaveBeenLastCalledWith(
      "/api/company/settings",
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visibility: "private" }),
      },
    );
    await expect(putResponse.json()).resolves.toEqual({ saved: true });
  });
});
