import { requireCompanyManagerSession } from "@/lib/auth/require-manager-session";
import { RequestCapacityWorkersStep3Screen } from "@/screens/request-capacity/RequestCapacityWorkersStep3Screen";

export default async function RequestCapacityWorkersStep3Page() {
  const session = await requireCompanyManagerSession();

  return <RequestCapacityWorkersStep3Screen user={session.user} />;
}
