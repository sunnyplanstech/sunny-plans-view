import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const Testimonial = () => {
  return (
    <section id="testimonial" className="py-20 md:py-32 bg-gradient-subtle">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-border shadow-lg bg-card relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-hero"></div>
            
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Quote Icon */}
                <div className="w-16 h-16 rounded-full bg-gradient-card flex items-center justify-center">
                  <Quote className="w-8 h-8 text-primary" />
                </div>

                {/* Testimonial Text */}
                <blockquote className="text-xl md:text-2xl font-medium leading-relaxed">
                  "SunnyPlans completely changed our land acquisition process. Instead of spending 
                  weeks manually researching substations and parcels, we now get pre-vetted opportunities 
                  with full constraint analysis delivered directly to us. It's like having a dedicated 
                  geo-analytics team without the overhead."
                </blockquote>

                {/* Author */}
                <div className="pt-4">
                  <p className="font-semibold text-lg">Sarah Chen</p>
                  <p className="text-muted-foreground">
                    Director of Development, GreenGrid Energy
                  </p>
                </div>

                {/* Company badge */}
                <div className="pt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>50+ MW BESS Portfolio</span>
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
