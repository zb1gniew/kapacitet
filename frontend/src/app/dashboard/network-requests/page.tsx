import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { NetworkEscalationsScreen } from "@/screens/network-escalations/NetworkEscalationsScreen";

export default async function NetworkRequestsPage() {
  const session = await requireServerAuthSession();

  return <NetworkEscalationsScreen user={session.user} />;
}
