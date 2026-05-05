import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { isPlatformAdmin } from "@/lib/auth/roles";
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
  const session = await getServerAuthSession();
  if (!session || !isPlatformAdmin(session.user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const response = await fetchBackend("/api/admin/companies", {
      method: "GET",
    });

    return createProxyResponse(response, await response.text());
  } catch {
    return NextResponse.json(
      { message: "Unable to load companies right now." },
      { status: 500 },
    );
  }
}
