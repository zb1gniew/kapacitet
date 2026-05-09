import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMatchAction } from "./useMatchAction";

describe("useMatchAction", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("tracks the active match while a request is in flight", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { result } = renderHook(() => useMatchAction());
    let actionPromise: Promise<{ ok: true } | { ok: false; error: string }>;

    act(() => {
      actionPromise = result.current.performAction(42, "accept");
    });

    expect(result.current.actionInProgress).toBe(42);

    resolveFetch?.(new Response(null, { status: 200 }));

    await act(async () => {
      await expect(actionPromise!).resolves.toEqual({ ok: true });
    });

    expect(result.current.actionInProgress).toBeNull();
  });

  it("returns the backend message for failed actions", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ detail: "Match is no longer available." }),
        {
          status: 409,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const { result } = renderHook(() => useMatchAction());
    let actionResult:
      | Awaited<ReturnType<typeof result.current.performAction>>
      | undefined;

    await act(async () => {
      actionResult = await result.current.performAction(5, "decline");
    });

    expect(actionResult).toEqual({
      ok: false,
      error: "Match is no longer available.",
    });
  });

  it("falls back to a status-based error when the backend body is not JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("nope", { status: 503 }),
    );

    const { result } = renderHook(() => useMatchAction());
    let actionResult:
      | Awaited<ReturnType<typeof result.current.performAction>>
      | undefined;

    await act(async () => {
      actionResult = await result.current.performAction(8, "supplier-confirm");
    });

    expect(actionResult).toEqual({
      ok: false,
      error: "Unable to update the match (503)",
    });
  });

  it("returns thrown network errors directly to the caller", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Connection lost"),
    );

    const { result } = renderHook(() => useMatchAction());
    let actionResult:
      | Awaited<ReturnType<typeof result.current.performAction>>
      | undefined;

    await act(async () => {
      actionResult = await result.current.performAction(15, "supplier-decline");
    });

    expect(actionResult).toEqual({
      ok: false,
      error: "Connection lost",
    });
    expect(result.current.actionInProgress).toBeNull();
  });
});
