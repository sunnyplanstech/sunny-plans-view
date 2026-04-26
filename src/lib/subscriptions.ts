import { ApiError, apiClient } from "@/lib/apiClient";

export type CheckoutFailure =
  | "unauthenticated" | "unverified" | "duplicate" | "server";

export class CheckoutError extends Error {
  constructor(
    public readonly reason: CheckoutFailure,
    message: string,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export interface ParcelPurchaseIntent {
  client_secret: string;
  amount: number;   // in cents
  currency: string;
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

/**
 * Mint a Stripe PaymentIntent for a one-off parcel purchase. The SPA
 * mounts a PaymentElement with the returned client_secret; on success
 * the webhook records the ParcelPurchase row.
 *   - 401 → CheckoutError("unauthenticated")
 *   - 403 → CheckoutError("unverified")
 *   - 409 → CheckoutError("duplicate") — user already owns this listing
 *   - other → CheckoutError("server")
 */
export async function createParcelPurchaseIntent(
  listingId: string,
): Promise<ParcelPurchaseIntent> {
  let res: Response;
  try {
    res = await apiClient(`/api/listings/${listingId}/create-purchase-intent/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      throw new CheckoutError("unauthenticated", "Sign in to purchase this listing.");
    }
    throw new CheckoutError("server", "Could not start checkout. Please try again.");
  }

  if (res.status === 401) {
    throw new CheckoutError("unauthenticated", "Your session expired. Sign in again.");
  }
  if (res.status === 403) {
    throw new CheckoutError("unverified", "Verify your email address before purchasing.");
  }
  if (res.status === 409) {
    throw new CheckoutError("duplicate", "You already have access to this listing.");
  }
  if (!res.ok) {
    throw new CheckoutError("server", "Could not start checkout. Please try again.");
  }

  return (await res.json()) as ParcelPurchaseIntent;
}

export { resendVerificationEmail } from "@/lib/auth";
