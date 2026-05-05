import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("supplier decline route", () => {
  it("posts supplier decline to the backend and handles failures", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify({ declined: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const ok = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "7" }),
    });
    await expect(ok.json()).resolves.toEqual({ declined: true });

    mockedFetchBackend.mockRejectedValueOnce(new Error("offline"));
    const failed = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "7" }),
    });
    expect(failed.status).toBe(500);
    await expect(failed.json()).resolves.toEqual({
      message: "Unable to decline the offer right now.",
    });
  });

  it("proxies a non-ok backend response", async () => {
    mockedFetchBackend.mockResolvedValue(
      new Response("Conflict", {
        status: 409,
        headers: { "content-type": "text/plain" },
      }),
    );

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "7" }),
    });

    expect(response.status).toBe(409);
    await expect(response.text()).resolves.toBe("Conflict");
  });
});
