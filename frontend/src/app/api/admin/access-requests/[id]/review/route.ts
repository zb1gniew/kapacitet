import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { fetchBackend } from "@/lib/backend/server-client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerAuthSession();
  if (!session || !isPlatformAdmin(session.user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.text();

    const response = await fetchBackend(`/api/AccessRequest/${id}/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
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
      { message: "Unable to process review right now." },
      { status: 500 },
    );
  }
}
