import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { RequestCapacityEquipmentStep4Screen } from "@/screens/request-capacity/RequestCapacityEquipmentStep4Screen";

export default async function RequestCapacityEquipmentStep4Page() {
  const session = await requireServerAuthSession();

  return <RequestCapacityEquipmentStep4Screen user={session.user} />;
}
