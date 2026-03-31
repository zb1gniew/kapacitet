"use client";

import { useEffect, useState } from "react";
import { fetchCatalog, type WorkflowCatalog } from "@/lib/backend/catalog";

export function useWorkflowCatalog() {
  const [catalog, setCatalog] = useState<WorkflowCatalog | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    void fetchCatalog(controller.signal)
      .then((result) => {
        setCatalog(result);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load the worker catalog.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  return {
    catalog,
    errorMessage,
    isLoading,
  };
}
