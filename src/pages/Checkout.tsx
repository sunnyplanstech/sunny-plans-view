import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import SEOHead from "@/components/listings/SEOHead";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 10;

const Checkout = () => {
  const { status } = useParams<{ status: string }>();

  if (status !== "success" && status !== "cancel") {
    return <Navigate to="/" replace />;
  }

  return status === "success" ? <CheckoutSuccess /> : <CheckoutCancel />;
};

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get("listing");
  return listingId
    ? <ParcelUnlockSuccess listingId={listingId} />
    : <SubscriptionSuccess />;
};

const SubscriptionSuccess = () => {
  const { user, refreshUser } = useAuth();
  const [polls, setPolls] = useState(0);
  const subscribed = user?.has_active_subscription === true;
  const timedOut = !subscribed && polls >= MAX_POLLS;

  // Stripe webhook flips has_active_subscription server-side; poll briefly
  // until we see it, then stop. After timeout the user can hit "Check again"
  // to re-arm the poll loop — beats telling them to reload the page.
  useEffect(() => {
    if (subscribed || polls >= MAX_POLLS) return;
    const timer = setTimeout(() => {
      void refreshUser();
      setPolls((p) => p + 1);
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [subscribed, polls, refreshUser]);

  const handleCheckAgain = () => {
    setPolls(0);
    void refreshUser();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Checkout Complete - Sunnyplans"
        description="Your Sunnyplans Premium subscription is active."
        canonicalUrl="https://sunnyplans.com/checkout/success"
      />
      <div className="container max-w-md py-16 px-4 flex-1">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">You're all set</h1>
          <p className="text-muted-foreground mb-6">
            {subscribed ? (
              <>Your Premium subscription is active. Exact coordinates and source links are now unlocked.</>
            ) : timedOut ? (
              <>Your payment was received. Premium access usually activates within a minute — tap "Check again" if you don't see it yet.</>
            ) : (
              <>Activating your Premium access…</>
            )}
          </p>
          <div className="w-full space-y-3">
            {timedOut && (
              <Button className="w-full" size="lg" onClick={handleCheckAgain}>
                Check again
              </Button>
            )}
            <Button asChild className="w-full" size="lg" variant={timedOut ? "outline" : "default"}>
              <Link to="/solar/app/united-states">Browse US listings</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/solar/app/italy">Browse Italian listings</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const ParcelUnlockSuccess = ({ listingId }: { listingId: string }) => (
  <div className="min-h-screen bg-background flex flex-col">
    <SEOHead
      title="Parcel Unlocked - Sunnyplans"
      description="Your parcel is unlocked on Sunnyplans."
    />
    <div className="container max-w-md py-16 px-4 flex-1">
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Parcel unlocked</h1>
        <p className="text-muted-foreground mb-6">
          Payment received. Exact coordinates and the source URL are now visible on this listing.
        </p>
        <div className="w-full space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link to={`/listing/${listingId}`}>Back to listing</Link>
          </Button>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

const CheckoutCancel = () => {
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get("listing");
  const backHref = listingId ? `/listing/${listingId}` : "/#pricing";
  const backLabel = listingId ? "Back to listing" : "Back to pricing";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Checkout Canceled - Sunnyplans"
        description="Your Sunnyplans checkout was canceled."
        canonicalUrl="https://sunnyplans.com/checkout/cancel"
      />
      <div className="container max-w-md py-16 px-4 flex-1">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <XCircle className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Checkout canceled</h1>
          <p className="text-muted-foreground mb-6">
            No payment was taken. You can come back anytime.
          </p>
          <div className="w-full space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link to={backHref}>{backLabel}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Return to homepage</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
