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

export async function POST() {
  try {
    const response = await fetchBackend("/api/notifications/read-all", {
      method: "POST",
    });
    if (!response.ok) {
      return await proxyError(response);
    }
    return jsonResponse({}, response.status);
  } catch {
    return jsonResponse(
      { message: "Unable to mark all notifications as read." },
      500,
    );
  }
}
