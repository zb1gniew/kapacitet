import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { fetchBackend } from "@/lib/backend/server-client";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session || !isPlatformAdmin(session.user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const response = await fetchBackend("/api/AccessRequest", {
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
      { message: "Unable to load access requests right now." },
      { status: 500 },
    );
  }
}
