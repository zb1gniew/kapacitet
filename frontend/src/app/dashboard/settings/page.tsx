import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { SettingsCompanyInformationScreen } from "@/screens/settings/SettingsCompanyInformationScreen";

export default async function SettingsPage() {
  const session = await requireServerAuthSession();

  return <SettingsCompanyInformationScreen user={session.user} />;
}
