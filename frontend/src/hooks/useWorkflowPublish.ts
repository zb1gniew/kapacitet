"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkflowPayloadResult } from "@/lib/workflows/payloads";
import { parseProblemDetails } from "@/lib/backend/errors";

type UseWorkflowPublishOptions<TPayload> = {
  clearDraft: () => void;
  getPayload: () => WorkflowPayloadResult<TPayload>;
  endpoint: string;
  successRoute: string;
  submitErrorMessage: string;
  networkErrorMessage: string;
};

export function useWorkflowPublish<TPayload>({
  clearDraft,
  getPayload,
  endpoint,
  successRoute,
  submitErrorMessage,
  networkErrorMessage,
}: UseWorkflowPublishOptions<TPayload>) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const publish = useCallback(async () => {
    const payload = getPayload();
    if (!payload.ok) {
      setErrorMessage(payload.errors.join(" "));
      setFieldErrors(payload.fieldErrors ?? {});
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload.value),
      });

      if (!response.ok) {
        if (response.status === 409) {
          clearDraft();
          router.push(successRoute);
          return;
        }

        if (response.status === 422) {
          const problemDetails = await parseProblemDetails(response);
          setFieldErrors(problemDetails.fieldErrors);
          setErrorMessage(problemDetails.message || submitErrorMessage);
          return;
        }

        setErrorMessage(submitErrorMessage);
        return;
      }

      clearDraft();
      router.push(successRoute);
    } catch {
      setErrorMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    clearDraft,
    endpoint,
    getPayload,
    networkErrorMessage,
    router,
    submitErrorMessage,
    successRoute,
  ]);

  return {
    errorMessage,
    fieldErrors,
    isSubmitting,
    publish,
  };
}
