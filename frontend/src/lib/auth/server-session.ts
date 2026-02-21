import { cookies } from "next/headers";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import type { AuthSession } from "@/types/auth";
import { isSessionExpired } from "./service";
import { parseSessionCookieValue } from "./session";

export async function getServerAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(AUTH_COOKIE_NAMES.session)?.value;

  if (!value) {
    return null;
  }

  const session = await parseSessionCookieValue(value);
  if (!session || isSessionExpired(session)) {
    return null;
  }

  return session;
}
