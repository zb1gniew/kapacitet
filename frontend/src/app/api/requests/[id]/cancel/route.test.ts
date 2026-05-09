import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("capacity request cancel route", () => {
  it("posts cancellation requests to the backend", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "Cancelled" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "27" }),
    });

    expect(mockedFetchBackend).toHaveBeenCalledWith("/api/requests/27/cancel", {
      method: "POST",
    });
    await expect(response.json()).resolves.toEqual({ status: "Cancelled" });
  });

  it("forwards backend errors unchanged", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response("Already cancelled", {
        status: 409,
        headers: { "content-type": "text/plain" },
      }),
    );

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "27" }),
    });

    expect(response.status).toBe(409);
    await expect(response.text()).resolves.toBe("Already cancelled");
  });

  it("returns a friendly error when the backend call throws", async () => {
    mockedFetchBackend.mockRejectedValueOnce(new Error("offline"));

    const response = await POST(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "27" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Unable to cancel the capacity request right now.",
    });
  });
});
