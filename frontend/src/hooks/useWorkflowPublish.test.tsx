import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkflowPublish } from "./useWorkflowPublish";

const pushMock = vi.fn();
const parseProblemDetailsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/lib/backend/errors", () => ({
  parseProblemDetails: (...args: unknown[]) => parseProblemDetailsMock(...args),
}));

describe("useWorkflowPublish", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockReset();
    parseProblemDetailsMock.mockReset();
  });

  it("surfaces client-side payload validation errors without submitting", async () => {
    const clearDraft = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { result } = renderHook(() =>
      useWorkflowPublish({
        clearDraft,
        endpoint: "/api/availability/publish",
        successRoute: "/availability/success",
        submitErrorMessage: "Unable to publish",
        networkErrorMessage: "Network unavailable",
        getPayload: () => ({
          ok: false as const,
          errors: ["Start date is required."],
          fieldErrors: {
            startDate: ["Start date is required."],
          },
        }),
      }),
    );

    await act(async () => {
      await result.current.publish();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBe("Start date is required.");
    expect(result.current.fieldErrors).toEqual({
      startDate: ["Start date is required."],
    });
    expect(clearDraft).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("submits successfully, clears the draft, and redirects", async () => {
    const clearDraft = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 201 }),
    );

    const { result } = renderHook(() =>
      useWorkflowPublish({
        clearDraft,
        endpoint: "/api/requests/publish",
        successRoute: "/requests/success",
        submitErrorMessage: "Unable to publish",
        networkErrorMessage: "Network unavailable",
        getPayload: () => ({
          ok: true as const,
          value: {
            quantity: 2,
            locationCity: "Aarhus",
          },
        }),
      }),
    );

    await act(async () => {
      await result.current.publish();
    });

    expect(clearDraft).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/requests/success");
    expect(result.current.errorMessage).toBe("");
    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it("treats conflict responses as already published and redirects", async () => {
    const clearDraft = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 409 }),
    );

    const { result } = renderHook(() =>
      useWorkflowPublish({
        clearDraft,
        endpoint: "/api/requests/publish",
        successRoute: "/requests/success",
        submitErrorMessage: "Unable to publish",
        networkErrorMessage: "Network unavailable",
        getPayload: () => ({
          ok: true as const,
          value: {
            quantity: 2,
            locationCity: "Aarhus",
          },
        }),
      }),
    );

    await act(async () => {
      await result.current.publish();
    });

    expect(clearDraft).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/requests/success");
    expect(result.current.errorMessage).toBe("");
  });

  it("stores backend field errors for unprocessable submissions", async () => {
    parseProblemDetailsMock.mockResolvedValueOnce({
      message: "Please review the highlighted fields.",
      fieldErrors: {
        quantity: ["Quantity must be greater than zero"],
      },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 422 }),
    );

    const { result } = renderHook(() =>
      useWorkflowPublish({
        clearDraft: vi.fn(),
        endpoint: "/api/requests/publish",
        successRoute: "/requests/success",
        submitErrorMessage: "Unable to publish",
        networkErrorMessage: "Network unavailable",
        getPayload: () => ({
          ok: true as const,
          value: {
            quantity: 0,
            locationCity: "Aarhus",
          },
        }),
      }),
    );

    await act(async () => {
      await result.current.publish();
    });

    expect(result.current.errorMessage).toBe(
      "Please review the highlighted fields.",
    );
    expect(result.current.fieldErrors).toEqual({
      quantity: ["Quantity must be greater than zero"],
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows the network fallback message when the request throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("socket hang up"),
    );

    const { result } = renderHook(() =>
      useWorkflowPublish({
        clearDraft: vi.fn(),
        endpoint: "/api/requests/publish",
        successRoute: "/requests/success",
        submitErrorMessage: "Unable to publish",
        networkErrorMessage: "Network unavailable",
        getPayload: () => ({
          ok: true as const,
          value: {
            quantity: 1,
            locationCity: "Aarhus",
          },
        }),
      }),
    );

    await act(async () => {
      await result.current.publish();
    });

    expect(result.current.errorMessage).toBe("Network unavailable");
    expect(result.current.isSubmitting).toBe(false);
  });
});
