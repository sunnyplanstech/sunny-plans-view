import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SEOHead from "@/components/listings/SEOHead";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

type Status = "pending" | "success" | "error";

const VerifyEmail = () => {
  const { key } = useParams<{ key: string }>();
  const [status, setStatus] = useState<Status>("pending");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!key) {
      setStatus("error");
      setErrorMessage("Missing verification key.");
      return;
    }

    const controller = new AbortController();
    fetch(`${API_BASE}/api/auth/registration/verify-email/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
          return;
        }
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMessage(
          (typeof data?.detail === "string" && data.detail) ||
            "This verification link is invalid or has expired.",
        );
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setStatus("error");
        setErrorMessage("Could not reach the server. Please try again.");
      });

    return () => controller.abort();
  }, [key]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Verify Email - Sunnyplans"
        description="Confirm your Sunnyplans email address."
        canonicalUrl="https://sunnyplans.com/verify-email"
      />
      <div className="container max-w-xl py-24 px-4">
        <Link to="/" className="text-primary hover:underline text-sm">&larr; Back to home</Link>
        <h1 className="text-3xl font-bold mt-4 mb-6">Email verification</h1>
        {status === "pending" && (
          <p className="text-muted-foreground">Verifying your email…</p>
        )}
        {status === "success" && (
          <div className="space-y-4">
            <p className="text-foreground">Your email is verified. You can now sign in.</p>
            <Button asChild>
              <Link to="/?auth=login">Sign in</Link>
            </Button>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-4">
            <p className="text-destructive">{errorMessage}</p>
            <Button asChild variant="outline">
              <Link to="/">Return to home</Link>
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default VerifyEmail;
