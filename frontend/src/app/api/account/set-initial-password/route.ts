import { NextRequest, NextResponse } from "next/server";
import { getBackendApiBaseUrl } from "@/lib/backend/config";

function buildSetInitialPasswordUrl(): string {
  return new URL(
    "/api/account/set-initial-password",
    getBackendApiBaseUrl(),
  ).toString();
}

function createProxyResponse(
  response: Response,
  body: string,
): NextResponse<string> {
  const contentType = response.headers.get("content-type");

  return new NextResponse(body, {
    status: response.status,
    headers: contentType ? { "content-type": contentType } : undefined,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const response = await fetch(buildSetInitialPasswordUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
    });

    return createProxyResponse(response, await response.text());
  } catch {
    return NextResponse.json(
      { message: "Unable to set password." },
      { status: 500 },
    );
  }
}
