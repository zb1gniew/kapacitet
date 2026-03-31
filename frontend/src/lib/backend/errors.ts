type ProblemDetailsPayload = {
  title?: string;
  detail?: string;
  fieldErrors?: Record<string, string[]>;
  errors?: Record<string, string[]>;
};

export async function parseProblemDetails(response: Response): Promise<{
  message: string;
  fieldErrors: Record<string, string[]>;
}> {
  const contentType = response.headers.get("content-type") ?? "";

  if (
    !contentType.includes("application/json") &&
    !contentType.includes("application/problem+json")
  ) {
    const message = await response.text();
    return {
      message: message || "The request failed.",
      fieldErrors: {},
    };
  }

  const payload = (await response.json()) as ProblemDetailsPayload;
  const fieldErrors = payload.fieldErrors ?? payload.errors ?? {};
  const message = payload.detail ?? payload.title ?? "The request failed.";

  return {
    message,
    fieldErrors,
  };
}
