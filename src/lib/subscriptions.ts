import { ApiError, apiClient } from "@/lib/apiClient";

export type CheckoutFailure = "unauthenticated" | "unverified" | "server";

export class CheckoutError extends Error {
  constructor(
    public readonly reason: CheckoutFailure,
    message: string,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

/**
 * Start a Stripe checkout session for the active user. Returns the redirect URL.
 *   - 401 → CheckoutError("unauthenticated")
 *   - 403 → CheckoutError("unverified")  (email not verified)
 *   - other → CheckoutError("server")
 */
export async function createCheckoutSession(): Promise<string> {
  let res: Response;
  try {
    res = await apiClient("/api/subscriptions/create-checkout-session/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      throw new CheckoutError("unauthenticated", "Sign in to subscribe.");
    }
    throw new CheckoutError("server", "Could not start checkout. Please try again.");
  }

  if (res.status === 401) {
    throw new CheckoutError("unauthenticated", "Your session expired. Sign in again.");
  }
  if (res.status === 403) {
    throw new CheckoutError("unverified", "Verify your email address before subscribing.");
  }
  if (!res.ok) {
    throw new CheckoutError("server", "Could not start checkout. Please try again.");
  }

  const data = (await res.json()) as { checkout_url: string };
  return data.checkout_url;
}

export { resendVerificationEmail } from "@/lib/auth";
