import { describe, expect, it, vi } from "vitest";
import { requireServerAuthSession } from "./require-auth-session";
import { getServerAuthSession } from "./server-session";

vi.mock("./server-session", () => ({ getServerAuthSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const mockedGetServerAuthSession = vi.mocked(getServerAuthSession);

describe("requireServerAuthSession", () => {
  it("returns the session when the user is authenticated", async () => {
    const session = {
      user: { sub: "user-1", email: "user@example.com" },
      accessToken: "token",
      expiresAt: 9999999999,
    };
    mockedGetServerAuthSession.mockResolvedValue(session);

    await expect(requireServerAuthSession()).resolves.toEqual(session);
  });

  it("redirects to home when there is no active session", async () => {
    mockedGetServerAuthSession.mockResolvedValue(null);

    await expect(requireServerAuthSession()).rejects.toThrow("NEXT_REDIRECT:/");
  });
});
