import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { RequestCapacityWorkersStep3Screen } from "@/screens/request-capacity/RequestCapacityWorkersStep3Screen";

export default async function RequestCapacityWorkersStep3Page() {
  const session = await requireServerAuthSession();

  return <RequestCapacityWorkersStep3Screen user={session.user} />;
}
