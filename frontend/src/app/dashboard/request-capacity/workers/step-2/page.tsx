import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { RequestCapacityWorkersStep2Screen } from "@/screens/request-capacity/RequestCapacityWorkersStep2Screen";

export default async function RequestCapacityWorkersStep2Page() {
  const session = await requireServerAuthSession();

  return <RequestCapacityWorkersStep2Screen user={session.user} />;
}
