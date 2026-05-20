import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend/server-client";

function createProxyResponse(response: Response, body: string) {
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET() {
  try {
    const response = await fetchBackend("/api/company/invitations", {
      method: "GET",
    });
    return createProxyResponse(response, await response.text());
  } catch {
    return NextResponse.json(
      { message: "Unable to load team members right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const response = await fetchBackend("/api/company/invitations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    return createProxyResponse(response, await response.text());
  } catch {
    return NextResponse.json(
      { message: "Failed to send invitation." },
      { status: 500 },
    );
  }
}
