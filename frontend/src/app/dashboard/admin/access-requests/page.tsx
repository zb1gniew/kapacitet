import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { AccessRequestsReviewScreen } from "@/screens/admin/AccessRequestsReviewScreen";

export default async function AdminAccessRequestsPage() {
  const session = await requireServerAuthSession();

  if (!isPlatformAdmin(session.user)) {
    redirect(APP_ROUTES.dashboard);
  }

  return <AccessRequestsReviewScreen user={session.user} />;
}
