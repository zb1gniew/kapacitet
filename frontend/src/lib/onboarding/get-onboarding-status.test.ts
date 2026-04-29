import { describe, expect, it, vi } from "vitest";
import { getOnboardingStatus } from "./get-onboarding-status";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("getOnboardingStatus", () => {
  it("returns the parsed onboarding status for successful responses", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ isOnboardingCompleted: true }), {
        status: 200,
      }),
    );

    await expect(getOnboardingStatus()).resolves.toEqual({
      isOnboardingCompleted: true,
    });
  });

  it("returns null on non-ok or failing responses", async () => {
    mockedFetchBackend.mockResolvedValue(new Response(null, { status: 500 }));
    await expect(getOnboardingStatus()).resolves.toBeNull();

    mockedFetchBackend.mockRejectedValue(new Error("offline"));
    await expect(getOnboardingStatus()).resolves.toBeNull();
  });
});
