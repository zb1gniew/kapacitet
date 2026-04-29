import { afterEach, describe, expect, it, vi } from "vitest";

describe("fetchCatalog", () => {
  afterEach(async () => {
    vi.resetModules();
  });

  it("loads and combines skills and certificates", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = String(input);
        if (url.endsWith("/api/catalog/skills")) {
          return new Response(JSON.stringify([{ id: 1, name: "Roofing" }]), {
            status: 200,
          });
        }

        return new Response(
          JSON.stringify([{ id: 10, name: "Lift license" }]),
          { status: 200 },
        );
      });

    const { fetchCatalog } = await import("./catalog");
    const catalog = await fetchCatalog();

    expect(catalog).toEqual({
      skills: [{ id: 1, name: "Roofing" }],
      certificates: [{ id: 10, name: "Lift license" }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reuses the cached catalog for repeated non-signaled requests", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(
        async () => new Response(JSON.stringify([]), { status: 200 }),
      );

    const { fetchCatalog } = await import("./catalog");
    await fetchCatalog();
    await fetchCatalog();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws when a catalog collection fails to load", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 }),
    );

    const { fetchCatalog } = await import("./catalog");

    await expect(fetchCatalog()).rejects.toThrow(
      "Failed to load catalog collection from /api/catalog/skills.",
    );
  });
});
