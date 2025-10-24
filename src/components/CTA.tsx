import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }).max(255),
});

const CTA = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = emailSchema.parse({ email });

      // TODO: Connect to your mailing list service
      console.log("Email signup:", validated.email);

      toast({
        title: "Welcome to SunnyPlans!",
        description: "Check your inbox for your first land data insights.",
      });

      setEmail("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid email",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 md:py-32 bg-gradient-subtle">
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
                  Join renewable energy developers receiving actual sale-ready parcels,
                  substation scores, and constraint analysis—completely free.
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
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <Button
                    variant="hero"
                    size="lg"
                    type="submit"
                    disabled={isLoading}
                    className="sm:w-auto"
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
