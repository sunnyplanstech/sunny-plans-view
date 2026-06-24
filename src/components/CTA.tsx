import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { openCalendlyPopup } from "@/lib/calendly";

const CTA = () => {
  return (
    <section id="signup" className="py-20 md:py-32 bg-gradient-subtle">
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
                  Sign up free, or unlock exact coordinates, source links, sun exposure, flat-acreage,
                  infrastructure distances, and the full SunnyScore breakdown for every parcel.
                </p>
              </div>
              {/* What You Get */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-sm">
                <div className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Exact coordinates</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Sun exposure &amp; PV yield</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>SunnyScore™ breakdown</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Constraint screening</span>
                </div>
              </div>
              {/* CTA Button */}
              <div className="max-w-md mx-auto">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => openCalendlyPopup()}
                >
                  Book a Call
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center items-center gap-8 pt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>U.S. Coverage</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span>Italy Now Live</span>
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
