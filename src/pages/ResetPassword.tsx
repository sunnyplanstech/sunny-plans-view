import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import SEOHead from "@/components/listings/SEOHead";
import Footer from "@/components/Footer";
import { toast } from "@/hooks/use-toast";
import { AuthError, confirmPasswordReset } from "@/lib/auth";

const schema = z
  .object({
    new_password1: z.string().min(8, "Password must be at least 8 characters"),
    new_password2: z.string(),
  })
  .refine((d) => d.new_password1 === d.new_password2, {
    message: "Passwords don't match",
    path: ["new_password2"],
  });

type FormValues = z.infer<typeof schema>;

const ResetPassword = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { new_password1: "", new_password2: "" },
  });

  const missingKey = !uid || !token;

  const onSubmit = async (values: FormValues) => {
    if (missingKey) return;
    setError(null);
    try {
      await confirmPasswordReset({
        uid: uid!,
        token: token!,
        new_password1: values.new_password1,
        new_password2: values.new_password2,
      });
      toast({
        title: "Password updated",
        description: "Sign in with your new password.",
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err instanceof AuthError
          ? err.message
          : "Could not reset password. The link may have expired — request a new one.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Reset Password - Sunnyplans"
        description="Set a new Sunnyplans password."
        canonicalUrl="https://sunnyplans.com/reset-password"
      />
      <div className="container max-w-md py-16 px-4 flex-1">
        <Link to="/login" className="text-primary hover:underline text-sm">
          &larr; Back to log in
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">Set a new password</h1>

        {missingKey ? (
          <div className="space-y-4 mt-6">
            <p className="text-destructive">
              This reset link is missing required information. Request a new one.
            </p>
            <Button variant="outline" asChild>
              <Link to="/forgot-password">Request a new link</Link>
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <FormField
                control={form.control}
                name="new_password1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="At least 8 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="new_password2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Repeat your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Updating..." : "Update password"}
              </Button>
            </form>
          </Form>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
