import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }).max(255),
  company: z.string().trim().max(255).optional(),
});

const CTA = () => {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validated = emailSchema.parse({ email, company });

      const formData = new FormData();
      formData.append("EMAIL", validated.email);
      if (validated.company) {
        formData.append("COMPANY", validated.company);
      }
      formData.append("b_351a2361ace4a073e652b3722_bc5e9b47ca", ""); // Honeypot field

      const url =
        "https://sunnyplans.us14.list-manage.com/subscribe/post-json?u=351a2361ace4a073e652b3722&id=bc5e9b47ca&f_id=0024c2e1f0";

      const response = await fetch(url, {
        method: "POST",
        body: formData,
        mode: "no-cors", // Mailchimp's endpoint supports this for AJAX submissions
      });

      // Since mode is no-cors, we can't read the response body directly.
      // For better error handling, consider using JSONP or a proxy if needed.
      // But assuming success if no fetch error.
      toast({
        title: "Welcome to SunnyPlans! 🌞",
        description: "We're excited to partner with you. Check your inbox for your first land data insights.",
      });
      setEmail("");
      setCompany("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid input",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Subscription error",
          description: "Something went wrong. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="signup" className="py-20 md:py-32 bg-gradient-subtle">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-1 shadow-glow">
            <div className="bg-card rounded-3xl p-8 md:p-12 text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-bold">
                  Start Getting{" "}
                  <span className="bg-gradient-hero bg-clip-text text-transparent">
                    Real Land Data
                  </span>{" "}
                  Today
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Join the renewable energy developers who trust us to deliver actual sale-ready parcels,
                  substation scores, and constraint analysis straight to their inbox—completely free. Let's get started.
                </p>
              </div>
              {/* What You Get */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
                <div className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Real listings weekly</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Substation proximity</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Constraint filtering</span>
                </div>
              </div>
              {/* Email Signup Form */}
              <div className="max-w-md mx-auto">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <Input
                    type="text"
                    placeholder="Company (optional)"
                    className="flex-1 h-12"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    variant="hero"
                    size="lg"
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Signing up..." : "Get Free Data"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-3">
                  No credit card required. Real parcels from day one.
                </p>
              </div>
              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center items-center gap-8 pt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>U.S. Coverage</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span>EU Expansion Coming</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>BESS & Solar Focus</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
