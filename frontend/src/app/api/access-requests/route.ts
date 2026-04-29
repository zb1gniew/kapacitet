import { NextRequest, NextResponse } from "next/server";
import { getBackendApiBaseUrl } from "@/lib/backend/config";
import { checkRateLimit } from "@/lib/rateLimit";

function buildBackendUrl(path: string) {
  const baseUrl = getBackendApiBaseUrl();
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function createProxyResponse(
  response: Response,
  body: string,
): NextResponse<string> {
  return new NextResponse(body, {
    status: response.status,
    headers: response.headers.get("content-type")
      ? {
          "content-type": response.headers.get("content-type") as string,
        }
      : undefined,
  });
}

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request, "access-requests", 5, 10 * 60 * 1000);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.text();

    const response = await fetch(buildBackendUrl("/api/AccessRequest"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body,
      cache: "no-store",
    });

    return createProxyResponse(response, await response.text());
  } catch (error) {
    console.error("Access request proxy failed", error);
    return NextResponse.json(
      { message: "Unable to reach backend access request service." },
      { status: 502 },
    );
  }
}
