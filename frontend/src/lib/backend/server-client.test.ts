import { describe, expect, it, vi } from "vitest";
import { fetchBackend } from "./server-client";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { getBackendApiBaseUrl } from "./config";

vi.mock("@/lib/auth/server-session", () => ({
  getServerAuthSession: vi.fn(),
}));

vi.mock("./config", () => ({
  getBackendApiBaseUrl: vi.fn(),
}));

const mockedGetServerAuthSession = vi.mocked(getServerAuthSession);
const mockedGetBackendApiBaseUrl = vi.mocked(getBackendApiBaseUrl);

describe("fetchBackend", () => {
  it("returns an unauthorized response when there is no server session", async () => {
    mockedGetServerAuthSession.mockResolvedValue(null);

    const response = await fetchBackend("/api/test");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "Authentication required. Sign in again to continue.",
    });
  });

  it("adds the bearer token and default cache mode for backend requests", async () => {
    mockedGetServerAuthSession.mockResolvedValue({
      user: { sub: "user-1" },
      accessToken: "access-token",
      expiresAt: 1,
    });
    mockedGetBackendApiBaseUrl.mockReturnValue("https://api.example");

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok"));

    await fetchBackend("/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });

    expect(fetchMock).toHaveBeenCalledWith("https://api.example/api/test", {
      method: "POST",
      headers: expect.any(Headers),
      body: "{}",
      cache: "no-store",
    });
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer access-token");
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("passes absolute urls through unchanged", async () => {
    mockedGetServerAuthSession.mockResolvedValue({
      user: { sub: "user-1" },
      accessToken: "access-token",
      expiresAt: 1,
    });
    mockedGetBackendApiBaseUrl.mockReturnValue("https://api.example");

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok"));

    await fetchBackend("https://external.example/api/ping");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://external.example/api/ping",
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});
