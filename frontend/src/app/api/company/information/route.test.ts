import { describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("company information route", () => {
  it("proxies get and put requests", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify({ name: "Acme" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const getResponse = await GET();
    await expect(getResponse.json()).resolves.toEqual({ name: "Acme" });

    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify({ saved: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const putResponse = await PUT(
      new Request("https://app.example/api/company/information", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      }) as never,
    );
    expect(mockedFetchBackend).toHaveBeenLastCalledWith(
      "/api/company/information",
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      },
    );
    await expect(putResponse.json()).resolves.toEqual({ saved: true });
  });
});
