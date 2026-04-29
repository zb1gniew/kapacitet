import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("onboarding status route", () => {
  it("returns the backend status response", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response(JSON.stringify({ isOnboardingCompleted: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET();

    expect(mockedFetchBackend).toHaveBeenCalledWith("/api/onboarding/status", {
      method: "GET",
    });
    await expect(response.json()).resolves.toEqual({
      isOnboardingCompleted: true,
    });
  });

  it("returns a friendly error when the backend call throws", async () => {
    mockedFetchBackend.mockRejectedValue(new Error("offline"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to load onboarding status right now.",
    });
  });
});
