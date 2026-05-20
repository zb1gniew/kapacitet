import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("company members route", () => {
  it("proxies get requests to the backend", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 1, email: "admin@example.com" }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET();

    expect(mockedFetchBackend).toHaveBeenCalledWith("/api/company/members", {
      method: "GET",
    });
    await expect(response.json()).resolves.toEqual([
      { id: 1, email: "admin@example.com" },
    ]);
  });
});
