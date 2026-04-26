import { API_BASE } from "@/lib/config";
import { ensureAccessToken } from "@/lib/auth";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
  ) {
    super(`API ${status}: ${path}`);
    this.name = "ApiError";
  }
}

/** Unauthenticated GET. Throws ApiError on non-2xx. */
export async function publicApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new ApiError(res.status, path);
  return (await res.json()) as T;
}

/**
 * GET that attaches a Bearer token if a session exists, otherwise calls
 * anonymously. For endpoints whose response shape varies by access state
 * (e.g. the listing detail endpoint, which returns "****" placeholders
 * for free users and formatted display strings for paying users).
 */
export async function optionalAuthApi<T>(path: string): Promise<T> {
  const access = await ensureAccessToken();
  const headers: Record<string, string> = {};
  if (access) headers["Authorization"] = `Bearer ${access}`;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new ApiError(res.status, path);
  return (await res.json()) as T;
}

/**
 * Authenticated request. Attaches a Bearer token and refreshes once on a 401
 * (e.g., the access token was revoked server-side before its local exp).
 *
 * Returns the raw Response so callers can inspect status — they should only
 * see a 401 here when the session is genuinely dead.
 */
export async function apiClient(path: string, options: RequestInit = {}): Promise<Response> {
  const access = await ensureAccessToken();
  if (!access) throw new ApiError(401, path);

  const send = (token: string) => {
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${API_BASE}${path}`, { ...options, headers });
  };

  const res = await send(access);
  if (res.status !== 401) return res;

  const fresh = await ensureAccessToken({ forceRefresh: true });
  if (!fresh) throw new ApiError(401, path);
  return send(fresh);
}
