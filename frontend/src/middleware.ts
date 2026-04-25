import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { APP_ROUTES } from "@/constants/routes";
import { getAuthConfig } from "@/lib/auth/config";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { parseSessionCookieValue } from "@/lib/auth/session";
import { getServerSession } from "@/lib/auth/session-store";

// ioredis uses Node.js net/tls — opt out of Edge Runtime
export const runtime = "nodejs";

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};

function buildAppRedirectUrl(path: string): URL {
  const { appUrl } = getAuthConfig();
  return new URL(path, appUrl);
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAMES.session)?.value;

  if (!sessionCookie) {
    if (request.nextUrl.pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(buildAppRedirectUrl(APP_ROUTES.home));
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
  const isAdminDashboardRoute =
    request.nextUrl.pathname === APP_ROUTES.adminOverview ||
    request.nextUrl.pathname.startsWith("/dashboard/admin");
  const userIsPlatformAdmin = isPlatformAdmin(session.user);

  // Already onboarded user trying to access onboarding → redirect to dashboard
  if (isOnboardingRoute && isOnboarded) {
    return NextResponse.redirect(buildAppRedirectUrl(APP_ROUTES.dashboard));
  }

  // Not onboarded user trying to access dashboard → redirect to onboarding
  // Platform admins are exempt — they have no company onboarding
  if (isDashboardRoute && !isOnboarded && !userIsPlatformAdmin) {
    return NextResponse.redirect(
      buildAppRedirectUrl(APP_ROUTES.onboardingWelcome),
    );
  }

  if (isDashboardRoute && userIsPlatformAdmin && !isAdminDashboardRoute) {
    return NextResponse.redirect(buildAppRedirectUrl(APP_ROUTES.adminOverview));
  }

  if (isAdminDashboardRoute && !userIsPlatformAdmin) {
    return NextResponse.redirect(buildAppRedirectUrl(APP_ROUTES.dashboard));
  }

  return NextResponse.next();
}
