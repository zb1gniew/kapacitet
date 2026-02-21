import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { DeclareAvailabilityWorkersStep3Screen } from "@/screens/availability/DeclareAvailabilityWorkersStep3Screen";

export default async function DeclareAvailabilityWorkersStep3Page() {
  const session = await requireServerAuthSession();

  return <DeclareAvailabilityWorkersStep3Screen user={session.user} />;
}
