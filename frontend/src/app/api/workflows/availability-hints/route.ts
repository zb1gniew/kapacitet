import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend/server-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const response = await fetchBackend("/api/availability/hints", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return NextResponse.json({ estimatedMatchCount: 0, hints: [] }, { status: 200 });
  }
}
