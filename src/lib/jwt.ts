const ACCESS_KEY = "sp_access_token";
const REFRESH_KEY = "sp_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

interface JwtPayload {
  exp: number;
  iat: number;
  jti: string;
  user_id: number;
  [key: string]: unknown;
}

export function decodeToken(token: string): JwtPayload {
  const base64 = token.split(".")[1];
  const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json) as JwtPayload;
}

/** Returns true if the token expires within the next 30 seconds. */
export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = decodeToken(token);
    return Date.now() / 1000 > exp - 30;
  } catch {
    return true;
  }
}
