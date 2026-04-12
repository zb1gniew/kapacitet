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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.text();
    const response = await fetchBackend(
      `/api/network-escalations/${id}/respond`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body,
      },
    );

    if (!response.ok) {
      return await proxyError(response);
    }

    return jsonResponse(await response.json(), response.status);
  } catch {
    return jsonResponse(
      { message: "Unable to submit the network response right now." },
      500,
    );
  }
}
