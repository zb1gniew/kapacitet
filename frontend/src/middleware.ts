import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { APP_ROUTES } from "@/constants/routes";
import { parseSessionCookieValue } from "@/lib/auth/session";
import { getServerSession } from "@/lib/auth/session-store";

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAMES.session)?.value;

  if (!sessionCookie) {
    if (request.nextUrl.pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL(APP_ROUTES.home, request.url));
    }
    return NextResponse.next();
  }

  const sessionId = await parseSessionCookieValue(sessionCookie);
  if (!sessionId) {
    return NextResponse.next();
  }

  const session = await getServerSession(sessionId);
  if (!session) {
    return NextResponse.next();
  }

  const isOnboarded = session.onboardingCompleted === true;
  const isOnboardingRoute = request.nextUrl.pathname.startsWith("/onboarding");
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");

  // Already onboarded user trying to access onboarding → redirect to dashboard
  if (isOnboardingRoute && isOnboarded) {
    return NextResponse.redirect(new URL(APP_ROUTES.dashboard, request.url));
  }

  // Not onboarded user trying to access dashboard → redirect to onboarding
  if (isDashboardRoute && !isOnboarded) {
    return NextResponse.redirect(
      new URL(APP_ROUTES.onboardingWelcome, request.url),
    );
  }

  return NextResponse.next();
}
