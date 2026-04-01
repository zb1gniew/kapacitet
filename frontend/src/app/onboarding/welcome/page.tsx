import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { getOnboardingStatus } from "@/lib/onboarding/get-onboarding-status";
import { WelcomePrinciplesScreen } from "@/screens/auth/WelcomePrinciplesScreen";

export default async function OnboardingWelcomePage() {
  await requireServerAuthSession();
  const status = await getOnboardingStatus();

  if (status?.isOnboardingCompleted) {
    redirect(APP_ROUTES.dashboard);
  }

  return <WelcomePrinciplesScreen />;
}
