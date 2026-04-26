import { useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { AuthError, buildNextQuery, readNextParam } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

const Login = () => {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const next = readNextParam(location.search);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await login(values.email, values.password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Login failed. Please try again.");
    }
  };

  const registerHref = `/register${next === "/" ? "" : buildNextQuery(next)}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Log In - Sunnyplans"
        description="Sign in to your Sunnyplans account."
        canonicalUrl="https://sunnyplans.com/login"
      />
      <div className="container max-w-md py-16 px-4 flex-1">
        <Link to="/" className="text-primary hover:underline text-sm">&larr; Back to home</Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">Log in</h1>
        <p className="text-muted-foreground mb-8">Welcome back to Sunnyplans.</p>

        <div className="space-y-4">
          <GoogleButton text="signin_with" next={next} onError={setError} />

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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        to="/forgot-password"
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="Your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Logging in..." : "Log in"}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to={registerHref} className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
