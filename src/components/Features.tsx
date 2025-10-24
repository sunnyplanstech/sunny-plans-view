import { Card, CardContent } from "@/components/ui/card";
import { Database, Filter, DollarSign, Clock, Shield, Globe } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Automated Land Indexing",
    description: "We index real estate data first, then select based on substation viability—reversing traditional workflows for faster site acquisition.",
  },
  {
    icon: Filter,
    title: "Multi-Layer Constraint Filtering",
    description: "Navigate naturalistic, historical, grid, geotechnical, and flood risks with precision mapping for BESS and small solar projects.",
  },
  {
    icon: DollarSign,
    title: "Reduce Infrastructure Costs",
    description: "Target substation-proximate parcels to minimize electrical infrastructure expenses and interconnection fees.",
  },
  {
    icon: Clock,
    title: "Time-Saving Intelligence",
    description: "Skip manual scouting near substations. Get pre-vetted, sale-ready parcels with full constraint analysis delivered instantly.",
  },
  {
    icon: Shield,
    title: "Permitting Viability",
    description: "Pre-screen sites for regulatory compliance, including historical preservation zones and environmental constraints.",
  },
  {
    icon: Globe,
    title: "U.S. & EU Ready",
    description: "Currently serving U.S. developers, with planned expansion to Italy, Spain, and Portugal for cross-border opportunities.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 md:py-32 bg-gradient-subtle">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Geo-Intelligence That Powers Your{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Renewable Pipeline
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From substation mapping to constraint analysis, SunnyPlans delivers the insights
            small to medium-sized BESS and solar developers need to succeed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-card flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
