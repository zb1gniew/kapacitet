import { fetchBackend } from "@/lib/backend/server-client";
import type { OnboardingStatus } from "@/types/onboarding";

export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  try {
    const response = await fetchBackend("/api/onboarding/status", {
      method: "GET",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as OnboardingStatus;
  } catch {
    return null;
  }
}
