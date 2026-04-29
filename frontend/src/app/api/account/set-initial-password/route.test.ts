import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { getBackendApiBaseUrl } from "@/lib/backend/config";

vi.mock("@/lib/backend/config", () => ({
  getBackendApiBaseUrl: vi.fn(),
}));

const mockedGetBackendApiBaseUrl = vi.mocked(getBackendApiBaseUrl);

describe("set initial password route", () => {
  it("proxies the password setup payload", async () => {
    mockedGetBackendApiBaseUrl.mockReturnValue("https://api.example");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const response = await POST(
      new Request("https://app.example/api/account/set-initial-password", {
        method: "POST",
        body: JSON.stringify({ token: "abc", password: "secret" }),
      }) as never,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example/api/account/set-initial-password",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "abc", password: "secret" }),
        cache: "no-store",
      },
    );
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("returns a friendly error on unexpected failures", async () => {
    mockedGetBackendApiBaseUrl.mockReturnValue("https://api.example");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    const response = await POST(
      new Request("https://app.example/api/account/set-initial-password", {
        method: "POST",
        body: JSON.stringify({}),
      }) as never,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to set password.",
    });
  });
});
