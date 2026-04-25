import type { AuthTokens } from "./types";

const ACCESS_KEY = "sp_access_token";
const REFRESH_KEY = "sp_refresh_token";

export function readTokens(): AuthTokens | null {
  const access = localStorage.getItem(ACCESS_KEY);
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!access || !refresh) return null;
  return { access, refresh };
}

export function writeTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.access);
  localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function clearStoredTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/** Fires when tokens change in another tab. Returns an unsubscribe function. */
export function subscribeTokenChanges(handler: () => void): () => void {
  const listener = (e: StorageEvent) => {
    if (e.storageArea !== localStorage) return;
    if (e.key === null || e.key === ACCESS_KEY || e.key === REFRESH_KEY) handler();
  };
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
