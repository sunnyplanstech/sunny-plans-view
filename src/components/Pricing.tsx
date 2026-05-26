import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { startSubscription } from "@/lib/subscriptions";
import { toast } from "@/hooks/use-toast";

const ENTERPRISE_URL = "https://calendly.com/eracle/new-meeting";
const SINGLE_PARCEL_PATH = "/solar/app/united-states";

type Tier = {
  name: string;
  price: string;
  period?: string;
  description: string;
  guarantee?: string;
  features: string[];
  cta: string;
  highlighted: boolean;
};

const tiers: Tier[] = [
  {
    name: "Free Tier",
    price: "Free",
    description: "Explore land opportunities across the US and Italy — no card required. Data is obfuscated.",
    features: [
      "All 50 US states and 20 Italian regions",
      "SunnyScore™ with helping/hurting breakdown",
      "Obfuscated coordinates and price bands",
      "Toggleable constraint-layer overlays",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Single Parcel",
    price: "$49",
    period: "one-time",
    description: "Found one parcel worth a deeper look? Unlock just that listing without a subscription.",
    guarantee: "30-day money-back guarantee — no questions asked.",
    features: [
      "Permanent access to one listing",
      "Exact coordinates",
      "Direct link to the source listing",
      "No recurring charge",
    ],
    cta: "Browse & Unlock",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$299",
    period: "/month",
    description: "Full access to every parcel across the US and Italy.",
    guarantee: "30-day money-back guarantee — no questions asked.",
    features: [
      "Exact coordinates for every listing",
      "Direct links to source listings",
      "SunnyScore™ with full helping/hurting breakdown",
      "Sun exposure & PV yield per parcel (Global Solar Atlas)",
      "Sub-5% slope flat-acreage per parcel",
      "Distance to 53 OSM feature types (substations, roads, water…)",
      "Constraint screening (PAD-US, NWI, Natura 2000, vincolistica)",
      "Priority support",
    ],
    cta: "Go Premium",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams that need integrations and bulk access on top of the platform.",
    features: [
      "Everything in Premium",
      "API integrations (coming soon)",
      "Bulk data exports (coming soon)",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePremium = async () => {
    const outcome = await startSubscription(user);
    switch (outcome.kind) {
      case "needs_register":
        navigate("/register?next=%2F%23pricing");
        return;
      case "needs_verify":
        toast({
          title: "Verify your email",
          description: "Check your inbox for the verification link, then try again.",
        });
        return;
      case "ok":
        window.location.href = outcome.checkoutUrl;
        return;
      case "error":
        toast({
          title: "Checkout failed",
          description: outcome.message,
          variant: "destructive",
        });
    }
  };

  const handleFreeTier = () => {
    if (user) {
      window.location.href = "/";
    } else {
      navigate("/register");
    }
  };

  const handleEnterprise = () => {
    window.location.href = ENTERPRISE_URL;
  };

  const handleSingleParcel = () => {
    navigate(SINGLE_PARCEL_PATH);
  };

  const handlerFor = (tierName: string) => {
    if (tierName === "Premium") return handlePremium;
    if (tierName === "Enterprise") return handleEnterprise;
    if (tierName === "Single Parcel") return handleSingleParcel;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-start">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative h-full ${
                tier.highlighted
                  ? 'border-primary shadow-lg bg-gradient-card lg:scale-105'
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
                {tier.guarantee && (
                  <p className="text-xs text-muted-foreground pt-3">
                    {tier.guarantee}
                  </p>
                )}
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
