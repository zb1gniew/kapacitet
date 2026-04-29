import { describe, expect, it, vi } from "vitest";
import { completeOnboarding } from "./complete-onboarding";

describe("completeOnboarding", () => {
  it("returns ok when the API call succeeds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    await expect(
      completeOnboarding({ categories: ["construction"] }),
    ).resolves.toEqual({ ok: true });
  });

  it("returns the backend message when the API call fails with json", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Validation failed" }), {
        status: 400,
      }),
    );

    await expect(completeOnboarding()).resolves.toEqual({
      ok: false,
      message: "Validation failed",
    });
  });

  it("returns a network fallback message when the request throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    await expect(completeOnboarding()).resolves.toEqual({
      ok: false,
      message: "Could not reach the server. Please try again in a moment.",
    });
  });
});
