type CompleteOnboardingResult = { ok: true } | { ok: false; message: string };

export async function completeOnboarding(data?: {
  categories?: string[];
  defaultLocation?: string;
}): Promise<CompleteOnboardingResult> {
  try {
    const response = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data ?? {}),
    });

    if (response.ok) return { ok: true };

    const text = await response.text();
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        return { ok: false, message: parsed.message };
      }
    } catch {
      // not JSON
    }
    return { ok: false, message: "Something went wrong. Please try again." };
  } catch {
    return {
      ok: false,
      message: "Could not reach the server. Please try again in a moment.",
    };
  }
}
