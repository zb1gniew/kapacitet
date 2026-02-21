import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { RequestCapacityEquipmentStep3Screen } from "@/screens/request-capacity/RequestCapacityEquipmentStep3Screen";

export default async function RequestCapacityEquipmentStep3Page() {
  const session = await requireServerAuthSession();

  return <RequestCapacityEquipmentStep3Screen user={session.user} />;
}
