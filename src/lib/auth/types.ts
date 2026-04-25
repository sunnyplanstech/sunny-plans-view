export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  date_joined: string;
  email_verified: boolean;
  has_active_subscription: boolean;
}

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: Record<string, unknown> = {},
  ) {
    super(extractDetail(data, status));
    this.name = "AuthError";
  }
}

function extractDetail(data: Record<string, unknown>, status: number): string {
  if (typeof data?.detail === "string") return data.detail;
  const nfe = data?.non_field_errors;
  if (Array.isArray(nfe) && typeof nfe[0] === "string") return nfe[0];
  return `Auth request failed (${status})`;
}
