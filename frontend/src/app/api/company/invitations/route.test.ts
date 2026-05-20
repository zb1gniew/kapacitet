import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("company invitations route", () => {
  it("proxies get requests to the backend", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 2, email: "viewer@example.com" }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET();

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/company/invitations",
      {
        method: "GET",
      },
    );
    await expect(response.json()).resolves.toEqual([
      { id: 2, email: "viewer@example.com" },
    ]);
  });

  it("proxies post requests to the backend", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 3, email: "new@example.com" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(
      new Request("https://app.example/api/company/invitations", {
        method: "POST",
        body: JSON.stringify({ email: "new@example.com", role: "Viewer" }),
      }) as never,
    );

    expect(mockedFetchBackend).toHaveBeenLastCalledWith(
      "/api/company/invitations",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "new@example.com", role: "Viewer" }),
      },
    );
    await expect(response.json()).resolves.toEqual({
      id: 3,
      email: "new@example.com",
    });
  });
});
