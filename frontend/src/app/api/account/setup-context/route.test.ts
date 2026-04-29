import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { getBackendApiBaseUrl } from "@/lib/backend/config";

vi.mock("@/lib/backend/config", () => ({
  getBackendApiBaseUrl: vi.fn(),
}));

const mockedGetBackendApiBaseUrl = vi.mocked(getBackendApiBaseUrl);

describe("setup context route", () => {
  it("requires a token query parameter", async () => {
    const response = await GET(
      new NextRequest("https://app.example/api/account/setup-context"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Token is required.",
    });
  });

  it("proxies the token lookup to the backend", async () => {
    mockedGetBackendApiBaseUrl.mockReturnValue("https://api.example");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ email: "user@example.invalid" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET(
      new NextRequest(
        "https://app.example/api/account/setup-context?token=setup-token",
      ),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example/api/account/setup-context?token=setup-token",
      { cache: "no-store" },
    );
    await expect(response.json()).resolves.toEqual({
      email: "user@example.invalid",
    });
  });
});
