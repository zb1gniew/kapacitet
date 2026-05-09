import { NextRequest, NextResponse } from "next/server";
import { getBackendApiBaseUrl } from "@/lib/backend/config";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { message: "Token is required." },
      { status: 400 },
    );
  }

  try {
    const url = new URL(
      "/api/account/password-reset-context",
      getBackendApiBaseUrl(),
    );
    url.searchParams.set("token", token);
    const response = await fetch(url.toString(), { cache: "no-store" });

    const text = await response.text();
    const contentType = response.headers.get("content-type");
    return new NextResponse(text, {
      status: response.status,
      headers: contentType ? { "content-type": contentType } : undefined,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to validate reset link." },
      { status: 500 },
    );
  }
}
