interface JwtPayload {
  exp: number;
  iat: number;
  jti: string;
  user_id?: number;
  [k: string]: unknown;
}

function decode(token: string): JwtPayload | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const json = atob(segment.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as JwtPayload;
    return typeof payload?.exp === "number" ? payload : null;
  } catch {
    return null;
  }
}

/**
 * True if the token is missing, malformed, or within `skewSec` seconds of expiry.
 * `skewSec` defaults to 30s so we refresh just before the server would reject.
 */
export function isExpired(token: string | null | undefined, skewSec = 30): boolean {
  if (!token) return true;
  const payload = decode(token);
  if (!payload) return true;
  return Date.now() / 1000 > payload.exp - skewSec;
}
