import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { PlatformOverviewScreen } from "@/screens/admin/PlatformOverviewScreen";

export default async function AdminOverviewPage() {
  const session = await requireServerAuthSession();

  if (!isPlatformAdmin(session.user)) {
    redirect(APP_ROUTES.dashboard);
  }

  return <PlatformOverviewScreen user={session.user} />;
}
