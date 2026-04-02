import { NextRequest, NextResponse } from "next/server";
import { getBackendApiBaseUrl } from "@/lib/backend/config";

function buildCheckNewUrl(email: string): string {
  const url = new URL("/api/account/check-new", getBackendApiBaseUrl());
  url.searchParams.set("email", email);
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
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json(
      { message: "Email is required." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(buildCheckNewUrl(email), {
      cache: "no-store",
    });

    return createProxyResponse(response, await response.text());
  } catch {
    return NextResponse.json(
      { message: "Unable to check account status." },
      { status: 500 },
    );
  }
}
