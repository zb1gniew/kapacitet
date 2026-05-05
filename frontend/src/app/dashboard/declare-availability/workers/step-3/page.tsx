import { requireCompanyManagerSession } from "@/lib/auth/require-manager-session";
import { DeclareAvailabilityWorkersStep3Screen } from "@/screens/availability/DeclareAvailabilityWorkersStep3Screen";

export default async function DeclareAvailabilityWorkersStep3Page() {
  const session = await requireCompanyManagerSession();

  return <DeclareAvailabilityWorkersStep3Screen user={session.user} />;
}
