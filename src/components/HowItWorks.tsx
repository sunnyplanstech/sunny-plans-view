import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Automated Data Indexing",
    description: "We continuously index real estate listings for small to medium-sized land parcels available for sale across U.S. and Italian markets.",
  },
  {
    number: "02",
    title: "Substation Proximity Analysis",
    description: "Filter parcels based on distance to substations and grid infrastructure, ensuring optimal tie-in opportunities for BESS and solar.",
  },
  {
    number: "03",
    title: "Constraint Layer Mapping",
    description: "Screen against authoritative datasets—FEMA flood zones, PAD-US protected areas, Natura 2000 reserves, USPVDB solar plant locations—to de-risk every parcel.",
  },
  {
    number: "04",
    title: "SunnyScore™ Ranking",
    description: "Our proprietary machine learning model scores each parcel from 0 to 100, combining grid proximity, constraint analysis, and solar potential into one actionable rating.",
  },
  {
    number: "05",
    title: "Curated Opportunities",
    description: "Receive top-ranked, pre-vetted parcels with full scoring breakdowns—delivered to your inbox or explored on our interactive heatmap.",
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
            Let's walk through how we transform your land acquisition process. We reverse the traditional 
            workflow—starting with land data, then optimizing for substation proximity and constraint-free development.
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
