import { NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend/server-client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const response = await fetchBackend(`/api/availability/${id}`, {
      method: "GET",
    });
    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to load availability right now." },
      { status: 500 },
    );
  }
}
