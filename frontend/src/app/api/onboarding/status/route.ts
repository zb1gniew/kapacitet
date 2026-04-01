import { NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend/server-client";

export async function GET() {
  try {
    const response = await fetchBackend("/api/onboarding/status", {
      method: "GET",
    });
    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to load onboarding status right now." },
      { status: 500 },
    );
  }
}
