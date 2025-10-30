import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free Tier",
    price: "Free",
    description: "Real land data delivered to your inbox",
    features: [
      "Weekly newsletter with actual sale-ready parcels",
      "Substation proximity scores",
      "Basic constraint filtering (flood, grid)",
      "Direct links to real estate listings",
      "Community access",
      "No credit card required",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$299",
    period: "/month",
    description: "Detailed data for active developers",
    features: [
      "Bi-weekly detailed parcel lists",
      "Full substation proximity analysis",
      "Grid constraint scoring",
      "Historical & naturalistic risk mapping",
      "Priority email support",
      "Export to CSV/GIS formats",
    ],
    cta: "Get Premium",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Advanced analytics for your portfolio",
    features: [
      "Custom geo-analytics mapping",
      "Permitting viability simulations",
      "Multi-state portfolio analysis",
      "Dedicated account manager",
      "API access for integration",
      "White-label reporting",
      "EU expansion early access",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const Pricing = () => {
  const handlePaymentRedirect = (url) => {
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
            Whether you're exploring your first project or scaling a portfolio, we have a plan that fits.
            Let's find the right level of intelligence for your renewable energy goals.
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
                    tier.name === 'Premium' 
                      ? () => handlePaymentRedirect('https://buy.stripe.com/4gM14pb5r7Wx4g1aOGaR200') 
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
