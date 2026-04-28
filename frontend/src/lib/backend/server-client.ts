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

function createUnauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({
      message: "Authentication required. Sign in again to continue.",
    }),
    {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    },
  );
}

export async function fetchBackend(
  path: string,
  options: BackendFetchOptions = {},
): Promise<Response> {
  const session = await getServerAuthSession();
  if (!session) {
    return createUnauthorizedResponse();
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${session.accessToken}`);

  return fetch(buildBackendUrl(path), {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  });
}
