import { requireCompanyManagerSession } from "@/lib/auth/require-manager-session";
import { RequestCapacityWorkersStep4Screen } from "@/screens/request-capacity/RequestCapacityWorkersStep4Screen";

export default async function RequestCapacityWorkersStep4Page() {
  const session = await requireCompanyManagerSession();

  return <RequestCapacityWorkersStep4Screen user={session.user} />;
}
