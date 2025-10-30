import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free Tier",
    price: "Free",
    description: "Tease into real land opportunities with monthly insights—no credit card needed. Perfect for discovering single-state parcels (selected at signup).",
    features: [
      "1 monthly email with a full list of sale-ready parcels (only a few include contact info/links)",
      "Basic substation proximity scores",
      "Simple constraint filtering (flood, grid)",
      "Community access",
      "Single US state (selected at signup)",
      "Direct links to select real estate listings",
    ],
    cta: "Start Free – Select your state at signup",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$299",
    period: "/month per state",
    description: "Curated data for active developers chasing vetted sites. Ideal for diving deep in one state (for multi-state, contact sales for Enterprise discounts). Select your state at signup.",
    features: [
      "1 monthly email with ~50 selected parcel listings (full details)",
      "Full substation proximity analysis",
      "Grid constraint scoring",
      "Historical & naturalistic risk mapping",
      "Export to CSV/GIS formats",
      "Priority email support",
      "Single US state (selected at signup)",
    ],
    cta: "Get Premium – Select your state at signup",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: " (multi-state discounts available)",
    description: "Advanced geo-analytics solution for portfolio growth. Map-based discovery tailored to your needs—no emails, just powerful tools.",
    features: [
      "Interactive map interface for parcel discovery",
      "Permitting viability simulations",
      "Multi-state or custom coverage (based on agreement)",
      "Custom integrations (e.g., API for your systems)",
      "Dedicated account manager",
      "Export to CSV/GIS formats (unlimited)",
      "White-label reporting",
      "EU expansion early access",
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
            Choose Your{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Intelligence Level
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Pioneering geo-analytics that empower your BESS or small solar projects—whether you're starting with teasers or scaling with custom maps. Let's find the right fit to overcome permitting hurdles and slash infrastructure costs.
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
