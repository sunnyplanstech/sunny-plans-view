import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const Testimonial = () => {
  return (
    <section id="testimonial" className="py-16 md:py-24 bg-gradient-subtle">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="border-border shadow-lg bg-card relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-hero"></div>
           
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Quote Icon */}
                <div className="w-12 h-12 rounded-full bg-gradient-card flex items-center justify-center">
                  <Quote className="w-6 h-6 text-primary" />
                </div>
                {/* Testimonial Text */}
                <blockquote className="text-base md:text-lg font-medium leading-relaxed">
                  "My experience with SunnyPlans has been very positive, especially for its ability to identify areas with potential land suitable for our purpose. This feature has proven extremely useful, providing our local intermediaries with the necessary information to conduct direct inspections or establish contacts in the area of interest. This approach not only facilitated the understanding of local market dynamics, but also allowed us to focus on particularly promising areas, close to substations and therefore ideal for our projects."
                </blockquote>
                {/* Author */}
                <div className="pt-4">
                  <p className="font-semibold text-lg">
                    <a 
                      href="https://it.linkedin.com/in/manuel-falciatori-a7131ab4" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Manuel Falciatori
                    </a>
                  </p>
                  <p className="text-muted-foreground">
                    Business Development Coordinator,{" "}
                    <a 
                      href="https://www.linkedin.com/company/soltectrackers/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Soltec
                    </a>
                  </p>
                </div>
                {/* Company badge */}
                <div className="pt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>Global Solar Tracker Solutions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
