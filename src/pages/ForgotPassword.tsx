import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import SEOHead from "@/components/listings/SEOHead";
import Footer from "@/components/Footer";
import { AuthError, requestPasswordReset } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

const ForgotPassword = () => {
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await requestPasswordReset(values.email);
      setSubmittedEmail(values.email);
    } catch (err) {
      setError(
        err instanceof AuthError
          ? err.message
          : "Could not send reset email. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Forgot Password - Sunnyplans"
        description="Reset your Sunnyplans password."
        canonicalUrl="https://sunnyplans.com/forgot-password"
      />
      <div className="container max-w-md py-16 px-4 flex-1">
        <Link to="/login" className="text-primary hover:underline text-sm">
          &larr; Back to log in
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">Reset your password</h1>

        {submittedEmail ? (
          <div className="space-y-4 mt-6">
            <p className="text-foreground">
              If an account exists for <strong>{submittedEmail}</strong>, we've sent a link
              to reset your password. Check your inbox.
            </p>
            <p className="text-sm text-muted-foreground">
              The link expires in a short window — request a new one if it stops working.
            </p>
            <Button variant="outline" asChild>
              <Link to="/login">Return to log in</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground mb-6">
              Enter the email tied to your account and we'll send you a link to set a new
              password.
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            </Form>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
