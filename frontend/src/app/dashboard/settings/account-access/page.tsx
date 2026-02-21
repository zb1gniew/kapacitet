import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { SettingsAccountAccessScreen } from "@/screens/settings/SettingsAccountAccessScreen";

export default async function SettingsAccountAccessPage() {
  const session = await requireServerAuthSession();

  return <SettingsAccountAccessScreen user={session.user} />;
}
