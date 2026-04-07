import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { PlatformAuditScreen } from "@/screens/admin/PlatformAuditScreen";

export default async function AdminAuditPage() {
  const session = await requireServerAuthSession();

  if (!isPlatformAdmin(session.user)) {
    redirect(APP_ROUTES.dashboard);
  }

  return <PlatformAuditScreen user={session.user} />;
}
