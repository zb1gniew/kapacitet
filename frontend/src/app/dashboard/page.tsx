import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { DashboardScreen } from "@/screens/dashboard/DashboardScreen";

export default async function DashboardPage() {
  const session = await requireServerAuthSession();

  if (isPlatformAdmin(session.user)) {
    redirect(APP_ROUTES.adminOverview);
  }

  return <DashboardScreen user={session.user} />;
}
