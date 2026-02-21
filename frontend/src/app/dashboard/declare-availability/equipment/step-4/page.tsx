import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { DeclareAvailabilityEquipmentStep4Screen } from "@/screens/availability/DeclareAvailabilityEquipmentStep4Screen";

export default async function DeclareAvailabilityEquipmentStep4Page() {
  const session = await requireServerAuthSession();

  return <DeclareAvailabilityEquipmentStep4Screen user={session.user} />;
}
