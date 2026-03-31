import { NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend/server-client";

export async function GET() {
  try {
    const response = await fetchBackend("/api/catalog/certificates", {
      method: "GET",
      cache: "force-cache",
    });
    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json",
        "cache-control":
          response.headers.get("cache-control") ?? "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to load certificates right now." },
      { status: 500 },
    );
  }
}
