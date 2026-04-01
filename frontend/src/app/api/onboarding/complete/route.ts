import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/constants/auth";
import { parseSessionCookieValue } from "@/lib/auth/session";
import {
  getServerSession,
  updateServerSession,
} from "@/lib/auth/session-store";
import { fetchBackend } from "@/lib/backend/server-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const response = await fetchBackend("/api/onboarding/complete", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: body || "{}",
    });

    if (!response.ok) {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          "content-type":
            response.headers.get("content-type") ?? "application/json",
        },
      });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAMES.session)?.value;
    if (sessionCookie) {
      const sessionId = await parseSessionCookieValue(sessionCookie);
      if (sessionId) {
        const session = await getServerSession(sessionId);
        if (session) {
          session.onboardingCompleted = true;
          await updateServerSession(sessionId, session);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: "Unable to complete onboarding right now." },
      { status: 500 },
    );
  }
}
