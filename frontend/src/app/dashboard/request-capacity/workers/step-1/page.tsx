import { requireCompanyManagerSession } from "@/lib/auth/require-manager-session";
import { RequestCapacityWorkersStep1Screen } from "@/screens/request-capacity/RequestCapacityWorkersStep1Screen";

export default async function RequestCapacityWorkersStep1Page() {
  const session = await requireCompanyManagerSession();

  return <RequestCapacityWorkersStep1Screen user={session.user} />;
}
