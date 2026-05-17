import type { AuthTokens } from "./types";

const ACCESS_KEY = "sp_access_token";
const REFRESH_KEY = "sp_refresh_token";

// Same-tab session-change broadcast. The `storage` event only fires in
// OTHER tabs, so when this tab clears its own tokens (e.g. a terminal
// refresh failure inside `ensureAccessToken`) AuthContext would otherwise
// never learn that the session is dead. We fire a custom event so the
// in-tab subscriber path matches the cross-tab one.
const SESSION_CHANGE_EVENT = "sp:session-change";

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
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

/**
 * Fires when the session changes — either from another tab (`storage`
 * event) or from this tab via `clearStoredTokens` (custom event). Returns
 * an unsubscribe function.
 */
export function subscribeTokenChanges(handler: () => void): () => void {
  const storageListener = (e: StorageEvent) => {
    if (e.storageArea !== localStorage) return;
    if (e.key === null || e.key === ACCESS_KEY || e.key === REFRESH_KEY) handler();
  };
  window.addEventListener("storage", storageListener);
  window.addEventListener(SESSION_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", storageListener);
    window.removeEventListener(SESSION_CHANGE_EVENT, handler);
  };
}
