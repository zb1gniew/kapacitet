import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { DeclareAvailabilityWorkersStep2Screen } from "@/screens/availability/DeclareAvailabilityWorkersStep2Screen";

export default async function DeclareAvailabilityWorkersStep2Page() {
  const session = await requireServerAuthSession();

  return <DeclareAvailabilityWorkersStep2Screen user={session.user} />;
}
