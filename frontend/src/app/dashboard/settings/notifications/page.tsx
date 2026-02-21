import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { SettingsNotificationsScreen } from "@/screens/settings/SettingsNotificationsScreen";

export default async function SettingsNotificationsPage() {
  const session = await requireServerAuthSession();

  return <SettingsNotificationsScreen user={session.user} />;
}
