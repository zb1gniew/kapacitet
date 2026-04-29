import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { parseSessionCookieValue } from "@/lib/auth/session";
import {
  getServerSession,
  updateServerSession,
} from "@/lib/auth/session-store";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  parseSessionCookieValue: vi.fn(),
}));

vi.mock("@/lib/auth/session-store", () => ({
  getServerSession: vi.fn(),
  updateServerSession: vi.fn(),
}));

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedCookies = vi.mocked(cookies);
const mockedParseSessionCookieValue = vi.mocked(parseSessionCookieValue);
const mockedGetServerSession = vi.mocked(getServerSession);
const mockedUpdateServerSession = vi.mocked(updateServerSession);
const mockedFetchBackend = vi.mocked(fetchBackend);

describe("onboarding complete route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("proxies completion and marks the session as onboarded", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    mockedCookies.mockResolvedValue({
      get: vi
        .fn()
        .mockImplementation((name: string) =>
          name === AUTH_COOKIE_NAMES.session
            ? { value: "encrypted" }
            : undefined,
        ),
    } as never);
    mockedParseSessionCookieValue.mockResolvedValue("session-1");
    mockedGetServerSession.mockResolvedValue({
      user: { sub: "user-1" },
      accessToken: "token",
      expiresAt: 1,
      onboardingCompleted: false,
    });

    const response = await POST(
      new Request("https://app.example/api/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({ categories: ["construction"] }),
      }) as never,
    );

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/onboarding/complete",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categories: ["construction"] }),
      },
    );
    expect(mockedUpdateServerSession).toHaveBeenCalledWith(
      "session-1",
      expect.objectContaining({ onboardingCompleted: true }),
    );
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("proxies backend validation errors without mutating the session", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid data" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );
    mockedCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);

    const response = await POST(
      new Request("https://app.example/api/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({}),
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(mockedUpdateServerSession).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      message: "Invalid data",
    });
  });
});
