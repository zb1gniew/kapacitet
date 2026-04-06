import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { PlatformCompaniesScreen } from "@/screens/admin/PlatformCompaniesScreen";

export default async function AdminCompaniesPage() {
  const session = await requireServerAuthSession();

  if (!isPlatformAdmin(session.user)) {
    redirect(APP_ROUTES.dashboard);
  }

  return <PlatformCompaniesScreen user={session.user} />;
}
