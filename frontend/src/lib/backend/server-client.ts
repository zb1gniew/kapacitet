import { getServerAuthSession } from "@/lib/auth/server-session";
import { getBackendApiBaseUrl } from "./config";

type BackendFetchOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
};

function buildBackendUrl(path: string): string {
  const baseUrl = getBackendApiBaseUrl();
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function fetchBackend(
  path: string,
  options: BackendFetchOptions = {},
): Promise<Response> {
  const session = await getServerAuthSession();
  if (!session) {
    throw new Error("Authenticated backend requests require an active session");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${session.accessToken}`);

  return fetch(buildBackendUrl(path), {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  });
}
