import { NextRequest, NextResponse } from "next/server";
import { getBackendApiBaseUrl } from "@/lib/backend/config";

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
}
