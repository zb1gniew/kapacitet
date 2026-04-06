import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { PlatformSettingsScreen } from "@/screens/admin/PlatformSettingsScreen";

export default async function AdminPlatformSettingsPage() {
  const session = await requireServerAuthSession();

  if (!isPlatformAdmin(session.user)) {
    redirect(APP_ROUTES.dashboard);
  }

  return <PlatformSettingsScreen user={session.user} />;
}
