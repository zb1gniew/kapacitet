import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  delete process.env.BACKEND_API_URL;
});

describe("getBackendApiBaseUrl", () => {
  it("returns the URL with trailing slashes stripped", async () => {
    process.env.BACKEND_API_URL = "https://api.example.com/";
    const { getBackendApiBaseUrl } = await import("./config");

    expect(getBackendApiBaseUrl()).toBe("https://api.example.com");
  });

  it("returns the URL unchanged when there is no trailing slash", async () => {
    process.env.BACKEND_API_URL = "http://backend:5000";
    const { getBackendApiBaseUrl } = await import("./config");

    expect(getBackendApiBaseUrl()).toBe("http://backend:5000");
  });

  it("throws when BACKEND_API_URL is not set", async () => {
    const { getBackendApiBaseUrl } = await import("./config");

    expect(() => getBackendApiBaseUrl()).toThrow("BACKEND_API_URL");
  });
});
