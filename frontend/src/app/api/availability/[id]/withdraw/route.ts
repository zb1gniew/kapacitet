import { NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend/server-client";

async function proxyError(response: Response) {
  const text = await response.text();
  const contentType = response.headers.get("content-type");

  return new NextResponse(text, {
    status: response.status,
    headers: contentType ? { "content-type": contentType } : undefined,
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const response = await fetchBackend(`/api/availability/${id}/withdraw`, {
      method: "POST",
    });

    if (!response.ok) {
      return await proxyError(response);
    }

    return NextResponse.json(await response.json(), {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to withdraw availability right now." },
      { status: 500 },
    );
  }
}
