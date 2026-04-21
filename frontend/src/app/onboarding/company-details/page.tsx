import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { getOnboardingStatus } from "@/lib/onboarding/get-onboarding-status";
import { ConfirmCompanyDetailsScreen } from "@/screens/auth/ConfirmCompanyDetailsScreen";

export default async function CompanyDetailsPage() {
  await requireServerAuthSession();
  const status = await getOnboardingStatus();

  if (status?.isOnboardingCompleted) {
    redirect(APP_ROUTES.dashboard);
  }

  const company = status?.company ?? {
    name: "",
    categories: [],
    defaultLocation: "",
    contactEmail: "",
  };

  return <ConfirmCompanyDetailsScreen company={company} />;
}
