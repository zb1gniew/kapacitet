import { requireCompanyManagerSession } from "@/lib/auth/require-manager-session";
import { DeclareAvailabilityWorkersStep2Screen } from "@/screens/availability/DeclareAvailabilityWorkersStep2Screen";

export default async function DeclareAvailabilityWorkersStep2Page() {
  const session = await requireCompanyManagerSession();

  return <DeclareAvailabilityWorkersStep2Screen user={session.user} />;
}
