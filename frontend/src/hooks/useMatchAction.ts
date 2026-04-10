"use client";

import { useCallback, useState } from "react";

export type MatchActionType =
  | "accept"
  | "decline"
  | "supplier-confirm"
  | "supplier-decline";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function readErrorMessage(response: Response, fallback: string) {
  const errorBody = await response.json().catch(() => null);

  return (
    errorBody?.message ||
    errorBody?.detail ||
    errorBody?.title ||
    `${fallback} (${response.status})`
  );
}

export function useMatchAction() {
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  const performAction = useCallback(
    async (matchId: number, action: MatchActionType): Promise<ActionResult> => {
      setActionInProgress(matchId);

      try {
        const response = await fetch(`/api/matches/${matchId}/${action}`, {
          method: "POST",
        });

        if (!response.ok) {
          return {
            ok: false,
            error: await readErrorMessage(
              response,
              "Unable to update the match",
            ),
          };
        }

        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to update the match right now.",
        };
      } finally {
        setActionInProgress(null);
      }
    },
    [],
  );

  return {
    performAction,
    actionInProgress,
  };
}
