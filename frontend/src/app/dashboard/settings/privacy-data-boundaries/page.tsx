import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { SettingsPrivacyDataBoundariesScreen } from "@/screens/settings/SettingsPrivacyDataBoundariesScreen";

export default async function SettingsPrivacyDataBoundariesPage() {
  const session = await requireServerAuthSession();

  return <SettingsPrivacyDataBoundariesScreen user={session.user} />;
}
