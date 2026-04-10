import { NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend/server-client";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

async function proxyError(response: Response) {
  const contentType = response.headers.get("content-type");
  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: contentType ? { "content-type": contentType } : undefined,
  });
}

export async function GET() {
  try {
    const response = await fetchBackend("/api/matches");

    if (!response.ok) {
      return await proxyError(response);
    }

    return jsonResponse(await response.json(), response.status);
  } catch {
    return jsonResponse({ message: "Unable to load matches right now." }, 500);
  }
}
