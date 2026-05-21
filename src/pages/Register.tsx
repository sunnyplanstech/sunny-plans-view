import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import SEOHead from "@/components/listings/SEOHead";
import Footer from "@/components/Footer";
import GoogleButton from "@/components/auth/GoogleButton";
import Turnstile from "@/components/auth/Turnstile";
import { useAuth } from "@/hooks/useAuth";
import { AuthError, buildNextQuery, readNextParam } from "@/lib/auth";
import { env } from "@/env";

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password1: z.string().min(8, "Password must be at least 8 characters"),
    password2: z.string(),
  })
  .refine((d) => d.password1 === d.password2, {
    message: "Passwords don't match",
    path: ["password2"],
  });

type FormValues = z.infer<typeof schema>;

const Register = () => {
  const { signup } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const next = readNextParam(location.search);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password1: "", password2: "" },
  });

  const handleTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);
  const handleTurnstileExpire = useCallback(() => setTurnstileToken(""), []);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    if (!turnstileToken) {
      setError("Please complete the captcha before submitting.");
      return;
    }
    try {
      await signup(values.email, values.password1, values.password2, turnstileToken);
      const params = new URLSearchParams({ email: values.email });
      if (next !== "/") params.set("next", next);
      navigate(`/check-your-email?${params.toString()}`, { replace: true });
    } catch (err) {
      setTurnstileToken("");
      setError(err instanceof AuthError ? err.message : "Signup failed. Please try again.");
    }
  };

  const loginHref = `/login${next === "/" ? "" : buildNextQuery(next)}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Sign Up - Sunnyplans"
        description="Create a Sunnyplans account."
        canonicalUrl="https://sunnyplans.com/register"
      />
      <div className="container max-w-md py-16 px-4 flex-1">
        <Link to="/" className="text-primary hover:underline text-sm">&larr; Back to home</Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">Create your account</h1>
        <p className="text-muted-foreground mb-8">
          Free to sign up. Browse parcels right away — no card required.
        </p>

        <div className="space-y-4">
          <GoogleButton text="signup_with" next={next} onError={setError} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

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
              <FormField
                control={form.control}
                name="password1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="At least 8 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Repeat your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Turnstile
                siteKey={env.VITE_TURNSTILE_SITE_KEY}
                onVerify={handleTurnstileVerify}
                onExpire={handleTurnstileExpire}
                onError={handleTurnstileExpire}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating account..." : "Sign up"}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to={loginHref} className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
