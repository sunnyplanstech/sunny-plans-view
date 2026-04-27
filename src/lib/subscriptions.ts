import { ApiError, apiClient } from "@/lib/apiClient";
import type { UserProfile } from "@/lib/auth";

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

/**
 * Outcome of clicking any "Subscribe to Premium" entrypoint. The caller
 * picks how to render each branch (toast vs in-place screen, with or
 * without closing a drawer), but the decision tree itself is shared:
 *   - no user            → "needs_register"
 *   - email unverified   → "needs_verify"   (covers both pre-check and 403)
 *   - checkout url ready → "ok"
 *   - anything else      → "error"
 */
export type StartSubscriptionOutcome =
  | { kind: "needs_register" }
  | { kind: "needs_verify" }
  | { kind: "ok"; checkoutUrl: string }
  | { kind: "error"; message: string };

export async function startSubscription(
  user: UserProfile | null,
): Promise<StartSubscriptionOutcome> {
  if (!user) return { kind: "needs_register" };
  if (!user.email_verified) return { kind: "needs_verify" };
  try {
    const checkoutUrl = await createCheckoutSession();
    return { kind: "ok", checkoutUrl };
  } catch (err) {
    if (err instanceof CheckoutError && err.reason === "unverified") {
      return { kind: "needs_verify" };
    }
    return {
      kind: "error",
      message:
        err instanceof Error ? err.message : "Could not start checkout. Please try again.",
    };
  }
}

/** Same shape as StartSubscriptionOutcome, plus a "duplicate" branch for
 *  users who already own this listing. */
export type StartParcelPurchaseOutcome =
  | { kind: "needs_register" }
  | { kind: "needs_verify" }
  | { kind: "duplicate" }
  | { kind: "ok"; checkoutUrl: string }
  | { kind: "error"; message: string };

export async function startParcelPurchase(
  user: UserProfile | null,
  listingId: string,
): Promise<StartParcelPurchaseOutcome> {
  if (!user) return { kind: "needs_register" };
  if (!user.email_verified) return { kind: "needs_verify" };
  try {
    const checkoutUrl = await createParcelCheckoutSession(listingId);
    return { kind: "ok", checkoutUrl };
  } catch (err) {
    if (err instanceof CheckoutError) {
      if (err.reason === "unverified") return { kind: "needs_verify" };
      if (err.reason === "duplicate") return { kind: "duplicate" };
    }
    return {
      kind: "error",
      message:
        err instanceof Error ? err.message : "Could not start checkout. Please try again.",
    };
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

/**
 * Create a Stripe Checkout Session for a one-off parcel purchase. The SPA
 * redirects to the returned URL; the webhook records the ParcelPurchase
 * row from ``checkout.session.completed``.
 *   - 401 → CheckoutError("unauthenticated")
 *   - 403 → CheckoutError("unverified")
 *   - 409 → CheckoutError("duplicate") — user already owns this listing
 *   - other → CheckoutError("server")
 */
export async function createParcelCheckoutSession(
  listingId: string,
): Promise<string> {
  let res: Response;
  try {
    res = await apiClient(`/api/listings/${listingId}/create-checkout-session/`, {
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

  const data = (await res.json()) as { checkout_url: string };
  return data.checkout_url;
}

export { resendVerificationEmail } from "@/lib/auth";
