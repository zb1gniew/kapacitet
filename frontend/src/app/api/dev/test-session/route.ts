import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { createSessionCookieValue } from "@/lib/auth/session";
import { createServerSession } from "@/lib/auth/session-store";
import type { AuthSession } from "@/types/auth";

export async function GET(request: Request) {
  if (process.env.ENABLE_TEST_AUTH !== "true") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? "test.manager@kapacitet.net";
  const role = searchParams.get("role") ?? "Manager";
  const name = searchParams.get("name") ?? "Test User";

  const now = Math.floor(Date.now() / 1000);
  const session: AuthSession = {
    user: {
      sub: `test-${email}`,
      email,
      name,
      preferredUsername: email,
      emailVerified: true,
      roles: [role],
    },
    accessToken: "e2e-test-token",
    expiresAt: now + 3600,
    refreshExpiresAt: now + 30 * 24 * 3600,
    onboardingCompleted: true,
  };

  const sessionId = await createServerSession(session);
  const cookieValue = await createSessionCookieValue(sessionId, 3600);

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAMES.session,
    value: cookieValue,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 3600,
  });
  return response;
}
