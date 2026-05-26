import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Automated Data Indexing",
    description: "We continuously index real estate listings and cadastral parcels for small-to-medium land across the U.S. and Italian markets.",
  },
  {
    number: "02",
    title: "Grid & Infrastructure Proximity",
    description: "Each parcel is measured against 53 OSM feature types — substations, transformers, roads, railways, industrial zones, water — so interconnection cost shows up early, not after a site visit.",
  },
  {
    number: "03",
    title: "Constraint Screening",
    description: "We pre-screen against authoritative datasets — PAD-US protected areas and NWI wetlands in the U.S., Natura 2000 and Italian vincolistica in Italy, plus existing solar installations from OSM and USPVDB — so you only see what survives the filters.",
  },
  {
    number: "04",
    title: "Sun Exposure & Flat-Land Sampling",
    description: "Annual GHI, DNI, and fixed-tilt PV specific yield from the Global Solar Atlas, plus sub-5% slope acreage from the Copernicus 30 m DEM — sampled per parcel.",
  },
  {
    number: "05",
    title: "SunnyScore™ — With the Reasoning Attached",
    description: "Our proprietary model fuses every signal into a 0–100 score and ships the helping and hurting factors alongside it, so each ranking explains itself.",
  },
  {
    number: "06",
    title: "Browse, Filter, Share",
    description: "Explore top-ranked parcels on an interactive map. Pan and zoom to drill from country to state to county; share a viewport link and your colleague sees the same scope.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-32">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            How SunnyPlans{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Transforms
            </span>{" "}
            Land Acquisition
          </h2>
          <p className="text-lg text-muted-foreground">
            We reverse the traditional scout-then-check workflow: start with every available parcel,
            layer the signals that decide whether it can host a project, and surface only what survives.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row gap-6 items-start group"
            >
              {/* Step Number */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {step.number}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3 pt-2">
                <h3 className="text-2xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center pt-8">
                  <ArrowRight className="w-6 h-6 text-muted-foreground/50" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
