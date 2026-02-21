import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { RequestCapacityEquipmentStep2Screen } from "@/screens/request-capacity/RequestCapacityEquipmentStep2Screen";

export default async function RequestCapacityEquipmentStep2Page() {
  const session = await requireServerAuthSession();

  return <RequestCapacityEquipmentStep2Screen user={session.user} />;
}
