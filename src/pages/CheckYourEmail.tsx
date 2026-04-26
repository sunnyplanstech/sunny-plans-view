import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import SEOHead from "@/components/listings/SEOHead";
import Footer from "@/components/Footer";
import { toast } from "@/hooks/use-toast";
import { AuthError, readNextParam, resendVerificationEmail } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

const CheckYourEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resending, setResending] = useState(false);

  const params = new URLSearchParams(location.search);
  const email = params.get("email") ?? user?.email ?? null;
  const next = readNextParam(location.search);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await resendVerificationEmail(email);
      toast({
        title: "Verification email sent",
        description: `Check ${email} for the link.`,
      });
    } catch (err) {
      toast({
        title: "Could not resend",
        description:
          err instanceof AuthError ? err.message : "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Check Your Email - Sunnyplans"
        description="Verify your Sunnyplans email address."
        canonicalUrl="https://sunnyplans.com/check-your-email"
      />
      <div className="container max-w-md py-16 px-4 flex-1">
        <Link to="/" className="text-primary hover:underline text-sm">&larr; Back to home</Link>
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            {email ? (
              <>
                We sent a verification link to <strong>{email}</strong>. Click it to confirm
                your account.
              </>
            ) : (
              <>We sent a verification link to your inbox. Click it to confirm your account.</>
            )}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            You're already signed in and free to keep browsing — verification is only
            required when you subscribe.
          </p>

          <div className="w-full space-y-3">
            <Button
              className="w-full"
              onClick={() => navigate(next, { replace: true })}
            >
              Continue to {next === "/" ? "homepage" : "where I was"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={!email || resending}
            >
              {resending ? "Sending..." : "Resend verification email"}
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CheckYourEmail;
