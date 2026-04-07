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
    const response = await fetchBackend("/api/admin/preferences/platform", {
      method: "GET",
    });

    return createProxyResponse(response, await response.text());
  } catch {
    return NextResponse.json(
      { message: "Unable to load platform preferences right now." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.text();
    const response = await fetchBackend("/api/admin/preferences/platform", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body,
    });

    return createProxyResponse(response, await response.text());
  } catch {
    return NextResponse.json(
      { message: "Unable to save platform preferences right now." },
      { status: 500 },
    );
  }
}
