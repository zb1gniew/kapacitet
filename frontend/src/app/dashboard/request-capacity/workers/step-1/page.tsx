import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { RequestCapacityWorkersStep1Screen } from "@/screens/request-capacity/RequestCapacityWorkersStep1Screen";

export default async function RequestCapacityWorkersStep1Page() {
  const session = await requireServerAuthSession();

  return <RequestCapacityWorkersStep1Screen user={session.user} />;
}
