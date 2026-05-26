import { Card, CardContent } from "@/components/ui/card";
import {
  Database,
  Filter,
  Sun,
  Mountain,
  Zap,
  Layers,
  Globe,
  Brain,
} from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Automated Land Indexing",
    description:
      "We index real estate listings and cadastral parcels first, then rank by grid and solar fundamentals — reversing the traditional 'scout-then-check' workflow.",
  },
  {
    icon: Brain,
    title: "SunnyScore™ ML Rating",
    description:
      "Every parcel scored 0–100 by our proprietary model — and shipped with the helping and hurting factors broken out, so you can defend the shortlist instead of taking the score on faith.",
  },
  {
    icon: Sun,
    title: "Per-Parcel Sun Exposure & PV Yield",
    description:
      "Annual GHI, DNI, and fixed-tilt PV specific yield sampled at each parcel from the Global Solar Atlas (World Bank / Solargis) — no guessing how productive the site will be.",
  },
  {
    icon: Mountain,
    title: "Flat-Land Acreage",
    description:
      "Acres of sub-5% slope inside each lot, computed from the Copernicus 30 m DEM — sits below every cutoff developers we've talked to actually use.",
  },
  {
    icon: Zap,
    title: "Substation & Infrastructure Proximity",
    description:
      "Distance to 53 OSM feature types per parcel — substations, transformers, roads, railways, industrial zones, water, and more — to anchor your interconnection cost estimate.",
  },
  {
    icon: Filter,
    title: "Constraint Screening",
    description:
      "Parcels pre-filtered against PAD-US protected areas and NWI wetlands (US), Natura 2000 and Italian vincolistica (Italy). You only see what survives the filters developers actually run.",
  },
  {
    icon: Layers,
    title: "Toggleable Constraint Layers",
    description:
      "Flip protected-area and wetland overlays on and off on the map to see exactly why a parcel was filtered out — no opaque screening.",
  },
  {
    icon: Globe,
    title: "U.S. & Italy Coverage",
    description:
      "Live across all 50 U.S. states and 20 Italian regions, with Spain and Portugal on the roadmap.",
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
            Eight signals working in concert — score, breakdown, sun, slope, grid, constraints, overlays, and country coverage —
            so you can move from "long list" to "site visit" without leaving the map.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
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
