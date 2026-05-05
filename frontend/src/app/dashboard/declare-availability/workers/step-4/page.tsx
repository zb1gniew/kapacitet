import { requireCompanyManagerSession } from "@/lib/auth/require-manager-session";
import { DeclareAvailabilityWorkersStep4Screen } from "@/screens/availability/DeclareAvailabilityWorkersStep4Screen";

export default async function DeclareAvailabilityWorkersStep4Page() {
  const session = await requireCompanyManagerSession();

  return <DeclareAvailabilityWorkersStep4Screen user={session.user} />;
}
