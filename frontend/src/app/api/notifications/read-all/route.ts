import { NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend/server-client";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function POST() {
  try {
    const response = await fetchBackend("/api/notifications/read-all", {
      method: "POST",
    });
    if (!response.ok) {
      return jsonResponse(
        { message: "Unable to mark all as read." },
        response.status,
      );
    }
    return jsonResponse({}, response.status);
  } catch {
    return jsonResponse(
      { message: "Unable to mark all notifications as read." },
      500,
    );
  }
}
