import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { LoginScreen } from "@/screens/auth/LoginScreen";

export default async function Home() {
  const session = await getServerAuthSession();

  if (session) {
    redirect(APP_ROUTES.dashboard);
  }

  return <LoginScreen />;
}
