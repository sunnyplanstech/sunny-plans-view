import { fetchProfile, logoutOnServer, refreshAccessToken } from "./api";
import { isExpired } from "./jwt";
import {
  clearStoredTokens,
  readTokens,
  subscribeTokenChanges,
  writeTokens,
} from "./storage";
import { AuthError, type AuthTokens, type UserProfile } from "./types";

let inFlightRefresh: Promise<string> | null = null;

interface EnsureOptions {
  /** Skip the access-token cache and force a refresh round-trip. */
  forceRefresh?: boolean;
}

/**
 * Returns a valid access token, refreshing if needed.
 * Returns null when no usable session exists (no tokens, or refresh is dead).
 *
 * Concurrent callers share a single in-flight refresh.
 */
export async function ensureAccessToken({
  forceRefresh = false,
}: EnsureOptions = {}): Promise<string | null> {
  const tokens = readTokens();
  if (!tokens) return null;

  if (!forceRefresh && !isExpired(tokens.access)) return tokens.access;

  // Skip the network call if we can already prove the refresh token is dead.
  // SimpleJWT doesn't rotate refresh tokens, so its `exp` is authoritative.
  if (isExpired(tokens.refresh, 0)) {
    clearStoredTokens();
    return null;
  }

  if (!inFlightRefresh) {
    inFlightRefresh = refreshAccessToken(tokens.refresh)
      .then((access) => {
        writeTokens({ access, refresh: tokens.refresh });
        return access;
      })
      .catch((err: unknown) => {
        // 401 means the server rejected the refresh — definitively logged out.
        // Other errors (network, 5xx) are transient; keep tokens for retry.
        if (err instanceof AuthError && err.status === 401) clearStoredTokens();
        throw err;
      })
      .finally(() => {
        inFlightRefresh = null;
      });
  }

  try {
    return await inFlightRefresh;
  } catch {
    return null;
  }
}

export function setSession(tokens: AuthTokens): void {
  writeTokens(tokens);
}

export function endSession(): void {
  clearStoredTokens();
}

export function hasStoredSession(): boolean {
  return readTokens() !== null;
}

/** Best-effort server-side logout. Always safe to call; never throws. */
export async function revokeSessionOnServer(): Promise<void> {
  const tokens = readTokens();
  if (!tokens) return;
  try {
    await logoutOnServer(tokens.refresh);
  } catch {
    // Swallow — local state is already cleared by the caller.
  }
}

/**
 * Resolve the current user.
 *   - Returns the profile when a valid session exists.
 *   - Returns null when there is definitively no session (no tokens, or auth was rejected).
 *   - Throws on transient/network errors so callers can keep prior state.
 */
export async function loadCurrentUser(): Promise<UserProfile | null> {
  const access = await ensureAccessToken();
  if (!access) return null;
  try {
    return await fetchProfile(access);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) {
      endSession();
      return null;
    }
    throw err;
  }
}

export { subscribeTokenChanges };
