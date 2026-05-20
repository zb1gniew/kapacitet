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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const response = await fetchBackend(`/api/company/invitations/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return await proxyError(response);
    }

    return new NextResponse(null, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to cancel the invitation right now." },
      { status: 500 },
    );
  }
}
