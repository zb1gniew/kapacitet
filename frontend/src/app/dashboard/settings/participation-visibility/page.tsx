import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { SettingsParticipationVisibilityScreen } from "@/screens/settings/SettingsParticipationVisibilityScreen";

export default async function SettingsParticipationVisibilityPage() {
  const session = await requireServerAuthSession();

  return <SettingsParticipationVisibilityScreen user={session.user} />;
}
