import { API_BASE } from "@/lib/config";
import { AuthError, type AuthTokens, type UserProfile } from "./types";

interface DjRestAuthLoginResponse {
  access: string;
  refresh: string;
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
    tokens: { access: data.access, refresh: data.refresh },
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
  turnstileToken?: string,
): Promise<AuthResult> {
  return unwrapLogin(
    await postJson<DjRestAuthLoginResponse>("/api/auth/registration/", {
      email,
      password1,
      password2,
      turnstile_token: turnstileToken ?? "",
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

export async function requestPasswordReset(email: string): Promise<void> {
  await postJson("/api/auth/password/reset/", { email });
}

export interface PasswordResetConfirmInput {
  uid: string;
  token: string;
  new_password1: string;
  new_password2: string;
}

export async function confirmPasswordReset(input: PasswordResetConfirmInput): Promise<void> {
  await postJson("/api/auth/password/reset/confirm/", input);
}

export async function loginWithGoogle(code: string): Promise<AuthResult> {
  return unwrapLogin(
    await postJson<DjRestAuthLoginResponse>("/api/auth/google/", { code }),
  );
}
