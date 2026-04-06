const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  date_joined: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload {
  email: string;
  password1: string;
  password2: string;
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new AuthError(res.status, err);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

export class AuthError extends Error {
  constructor(
    public status: number,
    public data: Record<string, unknown>,
  ) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : typeof data?.non_field_errors === "object"
          ? (data.non_field_errors as string[])[0]
          : `Auth request failed (${status})`;
    super(detail);
    this.name = "AuthError";
  }
}

/** dj-rest-auth login returns { access_token, refresh_token, user } */
export async function login(payload: LoginPayload): Promise<{ tokens: AuthTokens; user: UserProfile }> {
  const data = await post<{
    access_token: string;
    refresh_token: string;
    user: UserProfile;
  }>("/api/auth/login/", payload);

  return {
    tokens: { access: data.access_token, refresh: data.refresh_token },
    user: data.user,
  };
}

export async function signup(payload: SignupPayload): Promise<{ tokens: AuthTokens; user: UserProfile }> {
  const data = await post<{
    access_token: string;
    refresh_token: string;
    user: UserProfile;
  }>("/api/auth/registration/", payload);

  return {
    tokens: { access: data.access_token, refresh: data.refresh_token },
    user: data.user,
  };
}

/** SimpleJWT refresh returns { access } */
export async function refreshTokens(refresh: string): Promise<AuthTokens> {
  const data = await post<{ access: string }>("/api/auth/token/refresh/", { refresh });
  return { access: data.access, refresh };
}

export async function fetchUserProfile(accessToken: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/profile/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new AuthError(res.status, {});
  return res.json();
}

export async function logout(refreshToken: string): Promise<void> {
  // Best-effort — don't throw if it fails
  await post("/api/auth/logout/", { refresh: refreshToken }).catch(() => {});
}
