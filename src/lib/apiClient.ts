import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenExpired } from "@/lib/jwt";
import { refreshTokens } from "@/lib/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

let refreshPromise: Promise<string> | null = null;

/** Ensure a valid access token, refreshing if needed. Returns the token or throws. */
async function ensureAccessToken(): Promise<string> {
  const access = getAccessToken();
  if (access && !isTokenExpired(access)) return access;

  const refresh = getRefreshToken();
  if (!refresh) {
    clearTokens();
    throw new Error("No refresh token");
  }

  // Mutex: reuse in-flight refresh to avoid concurrent refresh calls
  if (!refreshPromise) {
    refreshPromise = refreshTokens(refresh)
      .then((tokens) => {
        setTokens(tokens.access, tokens.refresh);
        return tokens.access;
      })
      .catch((err) => {
        clearTokens();
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/** Unauthenticated fetch wrapper for the Django API. */
export async function publicApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

/**
 * Authenticated fetch wrapper for the Django API.
 * Automatically attaches the JWT Bearer token and handles refresh on 401.
 */
export async function apiClient(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await ensureAccessToken();

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // If 401, try one refresh + retry
  if (res.status === 401) {
    const refresh = getRefreshToken();
    if (!refresh) throw new Error("Unauthorized");

    const tokens = await refreshTokens(refresh);
    setTokens(tokens.access, tokens.refresh);

    const retryHeaders = new Headers(options.headers);
    retryHeaders.set("Authorization", `Bearer ${tokens.access}`);
    return fetch(`${API_BASE}${path}`, { ...options, headers: retryHeaders });
  }

  return res;
}
