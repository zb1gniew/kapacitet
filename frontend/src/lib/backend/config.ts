function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getBackendApiBaseUrl(): string {
  const value = process.env.BACKEND_API_URL;
  if (!value) {
    throw new Error("Missing required environment variable: BACKEND_API_URL");
  }

  return normalizeUrl(value);
}
