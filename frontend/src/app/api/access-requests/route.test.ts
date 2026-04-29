import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { getBackendApiBaseUrl } from "@/lib/backend/config";

vi.mock("@/lib/backend/config", () => ({
  getBackendApiBaseUrl: vi.fn(),
}));

const mockedGetBackendApiBaseUrl = vi.mocked(getBackendApiBaseUrl);

describe("access requests route", () => {
  it("proxies the request payload to the backend", async () => {
    mockedGetBackendApiBaseUrl.mockReturnValue("https://api.example");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 1, status: "Pending" }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      );

    const response = await POST(
      new Request("https://app.example/api/access-requests", {
        method: "POST",
        body: JSON.stringify({ name: "Acme" }),
      }) as never,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example/api/AccessRequest",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Acme" }),
        cache: "no-store",
      },
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: 1,
      status: "Pending",
    });
  });

  it("returns a backend-unavailable response on fetch failure", async () => {
    mockedGetBackendApiBaseUrl.mockReturnValue("https://api.example");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    const response = await POST(
      new Request("https://app.example/api/access-requests", {
        method: "POST",
        body: JSON.stringify({}),
      }) as never,
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to reach backend access request service.",
    });
  });
});
