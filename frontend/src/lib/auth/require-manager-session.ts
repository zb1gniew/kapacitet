import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import type { AuthSession } from "@/types/auth";
import { isCompanyManager } from "./roles";
import { requireServerAuthSession } from "./require-auth-session";

export async function requireCompanyManagerSession(): Promise<AuthSession> {
  const session = await requireServerAuthSession();

  if (!isCompanyManager(session.user)) {
    redirect(APP_ROUTES.dashboard);
  }

  return session;
}
