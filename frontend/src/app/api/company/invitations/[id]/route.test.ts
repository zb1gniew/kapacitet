import { describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";
import { fetchBackend } from "@/lib/backend/server-client";

vi.mock("@/lib/backend/server-client", () => ({
  fetchBackend: vi.fn(),
}));

const mockedFetchBackend = vi.mocked(fetchBackend);

describe("company invitation delete route", () => {
  it("proxies delete requests to the backend", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response(null, {
        status: 204,
      }),
    );

    const response = await DELETE(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "42" }),
    });

    expect(mockedFetchBackend).toHaveBeenCalledWith(
      "/api/company/invitations/42",
      {
        method: "DELETE",
      },
    );
    expect(response.status).toBe(204);
  });

  it("forwards backend errors unchanged", async () => {
    mockedFetchBackend.mockResolvedValueOnce(
      new Response("Not found", {
        status: 404,
        headers: { "content-type": "text/plain" },
      }),
    );

    const response = await DELETE(new Request("https://app.example") as never, {
      params: Promise.resolve({ id: "42" }),
    });

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe("Not found");
  });
});
