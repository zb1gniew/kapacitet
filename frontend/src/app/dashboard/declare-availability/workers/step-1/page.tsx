import { requireCompanyManagerSession } from "@/lib/auth/require-manager-session";
import { DeclareAvailabilityWorkersStep1Screen } from "@/screens/availability/DeclareAvailabilityWorkersStep1Screen";

export default async function DeclareAvailabilityWorkersStep1Page() {
  const session = await requireCompanyManagerSession();

  return <DeclareAvailabilityWorkersStep1Screen user={session.user} />;
}
