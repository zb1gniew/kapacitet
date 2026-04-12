"use client";

import { useCallback, useState } from "react";
import type { NetworkResponseType } from "@/types/api-network-escalations";

type ActionResult = { ok: true } | { ok: false; error: string };

async function readErrorMessage(response: Response, fallback: string) {
  const errorBody = await response.json().catch(() => null);

  return (
    errorBody?.message ||
    errorBody?.detail ||
    errorBody?.title ||
    `${fallback} (${response.status})`
  );
}

export function useNetworkEscalationAction() {
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  const submitResponse = useCallback(
    async (
      escalationId: number,
      responseType: NetworkResponseType,
    ): Promise<ActionResult> => {
      setActionInProgress(escalationId);

      try {
        const response = await fetch(
          `/api/network-escalations/${escalationId}/respond`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ responseType }),
          },
        );

        if (!response.ok) {
          return {
            ok: false,
            error: await readErrorMessage(
              response,
              "Unable to submit the network response",
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
              : "Unable to submit the network response right now.",
        };
      } finally {
        setActionInProgress(null);
      }
    },
    [],
  );

  return {
    submitResponse,
    actionInProgress,
  };
}
