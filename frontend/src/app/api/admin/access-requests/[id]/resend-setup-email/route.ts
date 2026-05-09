import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { fetchBackend } from "@/lib/backend/server-client";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerAuthSession();
  if (!session || !isPlatformAdmin(session.user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const response = await fetchBackend(
      `/api/AccessRequest/${id}/resend-setup-email`,
      { method: "POST" },
    );

    if (!response.ok) {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: { "content-type": "application/json" },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { message: "Unable to resend setup email right now." },
      { status: 500 },
    );
  }
}
