import { getAccessToken } from "@/lib/jwt";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export class CheckoutError extends Error {
  constructor(public reason: "unauthenticated" | "unverified" | "server", message: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

export async function createCheckoutSession(): Promise<string> {
  const token = getAccessToken();
  if (!token) {
    throw new CheckoutError("unauthenticated", "Sign in to subscribe.");
  }

  const res = await fetch(`${API_BASE}/api/subscriptions/create-checkout-session/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });

  if (res.status === 401) {
    throw new CheckoutError("unauthenticated", "Your session expired. Sign in again.");
  }
  if (res.status === 403) {
    throw new CheckoutError(
      "unverified",
      "Verify your email address before subscribing.",
    );
  }
  if (!res.ok) {
    throw new CheckoutError("server", "Could not start checkout. Please try again.");
  }

  const data = (await res.json()) as { checkout_url: string };
  return data.checkout_url;
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/registration/resend-email/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw new Error("Could not resend verification email.");
  }
}
