import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { DeclareAvailabilityEquipmentStep2Screen } from "@/screens/availability/DeclareAvailabilityEquipmentStep2Screen";

export default async function DeclareAvailabilityEquipmentStep2Page() {
  const session = await requireServerAuthSession();

  return <DeclareAvailabilityEquipmentStep2Screen user={session.user} />;
}
