import { requireCompanyManagerSession } from "@/lib/auth/require-manager-session";
import { RequestCapacityWorkersStep2Screen } from "@/screens/request-capacity/RequestCapacityWorkersStep2Screen";

export default async function RequestCapacityWorkersStep2Page() {
  const session = await requireCompanyManagerSession();

  return <RequestCapacityWorkersStep2Screen user={session.user} />;
}
