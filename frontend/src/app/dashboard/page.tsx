import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { DashboardScreen } from "@/screens/dashboard/DashboardScreen";

export default async function DashboardPage() {
  const session = await requireServerAuthSession();

  return <DashboardScreen user={session.user} />;
}
