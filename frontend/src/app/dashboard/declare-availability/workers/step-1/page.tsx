import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { DeclareAvailabilityWorkersStep1Screen } from "@/screens/availability/DeclareAvailabilityWorkersStep1Screen";

export default async function DeclareAvailabilityWorkersStep1Page() {
  const session = await requireServerAuthSession();

  return <DeclareAvailabilityWorkersStep1Screen user={session.user} />;
}
