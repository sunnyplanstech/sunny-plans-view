import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free Tier",
    price: "Free",
    description: "Get started with monthly land insights—no card required. Focus on one state (chosen at signup).",
    features: [
      "Monthly email: Full list of sale-ready parcels (limited contacts/links)",
      "Basic substation proximity scores",
      "Simple filters (flood, grid)",
      "Community access",
      "One US state",
      "Links to select listings",
    ],
    cta: "Start Free – Pick Your State",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$299",
    period: "/month per state",
    description: "Vetted sites for serious developers. Dive deep in one state (multi-state? Contact sales for discounts).",
    features: [
      "Monthly email: ~50 curated parcels (full details)",
      "Advanced substation analysis",
      "Grid constraint scoring",
      "Risk mapping (historical/natural)",
      "CSV/GIS exports",
      "Priority support",
      "One US state",
    ],
    cta: "Go Premium – Pick Your State",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: " (multi-state discounts)",
    description: "Scalable geo-analytics for portfolio expansion. Interactive tools, no emails—just results.",
    features: [
      "Interactive map for discovery",
      "Permitting simulations",
      "Multi-state/custom coverage",
      "API integrations",
      "Dedicated manager",
      "Unlimited exports",
      "White-label reports",
      "EU early access",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const Pricing = () => {
  const handleRedirect = (url) => {
    window.location.href = url;
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
          {tiers.map((tier, index) => (
            <Card
              key={index}
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
                  onClick={
                    tier.name === 'Free Tier'
                      ? () => handleRedirect('#signup')
                      : tier.name === 'Premium'
                      ? () => handleRedirect('https://buy.stripe.com/4gM14pb5r7Wx4g1aOGaR200')
                      : tier.name === 'Enterprise'
                      ? () => handleRedirect('https://calendly.com/eracle/introductory-call-sunnyplans')
                      : undefined
                  }
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
