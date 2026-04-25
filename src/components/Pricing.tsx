import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CheckoutError, createCheckoutSession } from "@/lib/subscriptions";
import { toast } from "@/hooks/use-toast";

const ENTERPRISE_URL = "https://calendly.com/eracle/new-meeting";

const tiers = [
  {
    name: "Free Tier",
    price: "Free",
    description: "Explore land opportunities across the US and Italy—no card required. Data is obfuscated.",
    features: [
      "Browse all US states and Italian regions",
      "Obfuscated listing data",
      "Solar suitability scores (SunnyScore™)",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$299",
    period: "/month",
    description: "Full access to every parcel across the US and Italy with exact coordinates and source links.",
    features: [
      "Top-ranked parcels with full details",
      "Exact coordinates for every listing",
      "Direct links to the source listing (contact agents there)",
      "Solar suitability scores (SunnyScore™)",
      "Substation & transformer distance data",
      "Infrastructure distance data (highway, industrial, water)",
      "Priority support",
    ],
    cta: "Go Premium",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Scalable geo-analytics for portfolio expansion. Interactive tools, no emails—just results.",
    features: [
      "Interactive heatmap for discovery",
      "API integrations",
      "Dedicated manager",
      "Unlimited exports",
      "Multi-region coverage (US + Italy)",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const Pricing = () => {
  const { user, openAuthModal } = useAuth();

  const handlePremium = async () => {
    if (!user) {
      openAuthModal("signup");
      return;
    }
    if (!user.email_verified) {
      toast({
        title: "Verify your email",
        description: "Check your inbox for the verification link, then try again.",
      });
      return;
    }
    try {
      const url = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      const reason = err instanceof CheckoutError ? err.reason : "server";
      toast({
        title: reason === "unverified" ? "Verify your email" : "Checkout failed",
        description:
          err instanceof Error ? err.message : "Could not start checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFreeTier = () => {
    if (user) {
      window.location.href = "/";
    } else {
      openAuthModal("signup");
    }
  };

  const handleEnterprise = () => {
    window.location.href = ENTERPRISE_URL;
  };

  const handlerFor = (tierName: string) => {
    if (tierName === "Premium") return handlePremium;
    if (tierName === "Enterprise") return handleEnterprise;
    return handleFreeTier;
  };

  return (
    <section id="pricing" className="py-20 md:py-32">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Select Your{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Intelligence Tier
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Cutting-edge geo-analytics for BESS and small solar projects. Overcome permitting challenges and cut costs—find your perfect plan.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${
                tier.highlighted
                  ? 'border-primary shadow-lg scale-105 bg-gradient-card'
                  : 'border-border'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-hero text-primary-foreground text-sm font-semibold rounded-full shadow-md">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                <CardDescription className="text-base">{tier.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.period && (
                    <span className="text-muted-foreground">{tier.period}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {tier.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button
                  variant={tier.highlighted ? "hero" : "outline"}
                  className="w-full"
                  size="lg"
                  onClick={handlerFor(tier.name)}
                >
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
