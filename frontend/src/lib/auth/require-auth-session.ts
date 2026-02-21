import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import type { AuthSession } from "@/types/auth";
import { getServerAuthSession } from "./server-session";

export async function requireServerAuthSession(): Promise<AuthSession> {
  const session = await getServerAuthSession();

  if (!session) {
    redirect(APP_ROUTES.home);
  }

  return session;
}
