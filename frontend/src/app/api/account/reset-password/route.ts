import { NextRequest, NextResponse } from "next/server";
import { getBackendApiBaseUrl } from "@/lib/backend/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const response = await fetch(
      new URL("/api/account/reset-password", getBackendApiBaseUrl()).toString(),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        cache: "no-store",
      },
    );

    const text = await response.text();
    const contentType = response.headers.get("content-type");
    return new NextResponse(text, {
      status: response.status,
      headers: contentType ? { "content-type": contentType } : undefined,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to reset password." },
      { status: 500 },
    );
  }
}
