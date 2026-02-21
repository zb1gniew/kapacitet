import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { DeclareAvailabilityEquipmentStep3Screen } from "@/screens/availability/DeclareAvailabilityEquipmentStep3Screen";

export default async function DeclareAvailabilityEquipmentStep3Page() {
  const session = await requireServerAuthSession();

  return <DeclareAvailabilityEquipmentStep3Screen user={session.user} />;
}
