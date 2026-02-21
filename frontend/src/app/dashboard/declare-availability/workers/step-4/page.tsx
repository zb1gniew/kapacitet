import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { DeclareAvailabilityWorkersStep4Screen } from "@/screens/availability/DeclareAvailabilityWorkersStep4Screen";

export default async function DeclareAvailabilityWorkersStep4Page() {
  const session = await requireServerAuthSession();

  return <DeclareAvailabilityWorkersStep4Screen user={session.user} />;
}
