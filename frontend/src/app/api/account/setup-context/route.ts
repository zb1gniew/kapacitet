import { NextRequest, NextResponse } from "next/server";
import { getBackendApiBaseUrl } from "@/lib/backend/config";

function buildSetupContextUrl(token: string): string {
  const url = new URL("/api/account/setup-context", getBackendApiBaseUrl());
  url.searchParams.set("token", token);
  return url.toString();
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

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { message: "Token is required." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(buildSetupContextUrl(token), {
      cache: "no-store",
    });

    return createProxyResponse(response, await response.text());
  } catch {
    return NextResponse.json(
      { message: "Unable to validate setup link." },
      { status: 500 },
    );
  }
}
