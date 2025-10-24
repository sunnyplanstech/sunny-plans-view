import { Button } from "@/components/ui/button";
import { ArrowRight, Sun, Zap } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-subtle">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container px-4 py-20 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-card border border-border shadow-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Geo-Analytics for Renewable Energy</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Find{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Substation-Ready Land
            </span>{" "}
            for BESS & Solar Projects
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Let's simplify your land search together. Our automated geo-analytics index real estate data, 
            filter out constraints, and deliver pre-vetted parcels optimized for battery storage and small solar development.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button variant="hero" size="lg" className="group">
              Start Your Search Free
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg">
              See How It Works
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-primary" />
              <span>U.S. Coverage Now</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span>EU Expansion Coming</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary"></div>
              <span>BESS & Solar Focus</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-muted-foreground/30 rounded-full animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
