import { requireServerAuthSession } from "@/lib/auth/require-auth-session";
import { FirstActionScreen } from "@/screens/auth/FirstActionScreen";

export default async function FirstActionPage() {
  await requireServerAuthSession();
  return <FirstActionScreen />;
}
