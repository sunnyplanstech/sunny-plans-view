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

function withAuthHeader(options: RequestInit, token: string | null): RequestInit {
  if (!token) return options;
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return { ...options, headers };
}

/**
 * Send a request with the current access token (if any) and retry once on
 * 401 with a force-refreshed token. The refresh-on-401 path only fires
 * when we actually had a token — anonymous 401s aren't a token problem,
 * so retrying is pointless.
 */
async function sendWithAuthRetry(path: string, options: RequestInit): Promise<Response> {
  const access = await ensureAccessToken();
  const res = await fetch(`${API_BASE}${path}`, withAuthHeader(options, access));
  if (res.status !== 401 || !access) return res;

  const fresh = await ensureAccessToken({ forceRefresh: true });
  if (!fresh) return res;
  return fetch(`${API_BASE}${path}`, withAuthHeader(options, fresh));
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
 *
 * Refreshes the access token once on a 401 — same posture as `apiClient` —
 * so a stale-but-recoverable session doesn't fall back to the anonymous
 * response shape.
 */
export async function optionalAuthApi<T>(path: string): Promise<T> {
  const res = await sendWithAuthRetry(path, {});
  if (!res.ok) throw new ApiError(res.status, path);
  return (await res.json()) as T;
}

/**
 * Authenticated request. Requires a session and refreshes once on a 401
 * (e.g., the access token was revoked server-side before its local exp).
 *
 * Returns the raw Response so callers can inspect status — they should only
 * see a 401 here when the session is genuinely dead.
 */
export async function apiClient(path: string, options: RequestInit = {}): Promise<Response> {
  const access = await ensureAccessToken();
  if (!access) throw new ApiError(401, path);
  return sendWithAuthRetry(path, options);
}
