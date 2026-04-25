import { API_BASE } from "@/lib/config";
import { AuthError, type AuthTokens, type UserProfile } from "./types";

interface DjRestAuthLoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}

export interface AuthResult {
  tokens: AuthTokens;
  user: UserProfile;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new AuthError(res.status, data);
  }
  if (res.status === 204) return {} as T;
  return (await res.json()) as T;
}

function unwrapLogin(data: DjRestAuthLoginResponse): AuthResult {
  return {
    tokens: { access: data.access_token, refresh: data.refresh_token },
    user: data.user,
  };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return unwrapLogin(
    await postJson<DjRestAuthLoginResponse>("/api/auth/login/", { email, password }),
  );
}

export async function signup(
  email: string,
  password1: string,
  password2: string,
): Promise<AuthResult> {
  return unwrapLogin(
    await postJson<DjRestAuthLoginResponse>("/api/auth/registration/", {
      email,
      password1,
      password2,
    }),
  );
}

/**
 * Exchange a refresh token for a new access token. SimpleJWT does not rotate
 * refresh tokens by default, so the existing refresh stays valid.
 */
export async function refreshAccessToken(refresh: string): Promise<string> {
  const data = await postJson<{ access: string }>("/api/auth/token/refresh/", { refresh });
  return data.access;
}

/** Best-effort server-side logout. The caller should clear local state regardless. */
export async function logoutOnServer(refresh: string): Promise<void> {
  await postJson("/api/auth/logout/", { refresh });
}

export async function fetchProfile(accessToken: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/profile/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new AuthError(res.status, data);
  }
  return (await res.json()) as UserProfile;
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/registration/resend-email/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new AuthError(res.status, data);
  }
}
