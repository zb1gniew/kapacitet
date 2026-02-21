import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { RequestCapacityWorkersStep4Screen } from "@/screens/request-capacity/RequestCapacityWorkersStep4Screen";

export default async function RequestCapacityWorkersStep4Page() {
  const session = await requireServerAuthSession();

  return <RequestCapacityWorkersStep4Screen user={session.user} />;
}
