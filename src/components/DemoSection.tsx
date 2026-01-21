import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DemoProperty {
  id: number;
  image: string;
  distance_to_substation: number;
  price_per_sqft: number;
  listing_price: number;
  substation_max_voltage: number;
}

const DemoSection = () => {
  const { data: demoProperties, isLoading } = useQuery({
    queryKey: ['demo-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_properties')
        .select('*')
        .order('id');
      
      if (error) throw error;
      return data as DemoProperty[];
    },
  });

  if (isLoading) {
    return (
      <section id="demo" className="py-16 md:py-24 bg-background">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Skeleton className="h-10 w-80 mx-auto mb-4" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            <Skeleton className="h-80 w-full max-w-5xl mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="demo" className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-text bg-clip-text text-transparent">
              See Our Platform in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here are some examples of pre-vetted listings.
            </p>
          </div>
          {/* Property Carousel */}
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {demoProperties?.map((property) => (
                <CarouselItem key={property.id}>
                  <Card className="border-border shadow-elegant">
                    <CardContent className="p-0">
                      <div className="grid md:grid-cols-2 gap-0">
                        {/* Image */}
                        <div className="relative h-64 md:h-full bg-muted">
                          <img
                            src={property.image}
                            alt="Property"
                            className="w-full h-full object-contain"
                          />
                        </div>
                       
                        {/* Property Details */}
                        <div className="p-6 md:p-8 space-y-6">
                          <h3 className="text-2xl font-bold text-foreground">Property Details</h3>
                         
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-border">
                              <span className="text-muted-foreground">Distance to Substation</span>
                              <span className="text-lg font-semibold text-foreground">{property.distance_to_substation} miles</span>
                            </div>
                           
                            <div className="flex justify-between items-center pb-3 border-b border-border">
                              <span className="text-muted-foreground">Price per Sqft</span>
                              <span className="text-lg font-semibold text-foreground">${property.price_per_sqft}</span>
                            </div>
                           
                            <div className="flex justify-between items-center pb-3 border-b border-border">
                              <span className="text-muted-foreground">Listing Price</span>
                              <span className="text-lg font-semibold text-foreground">${property.listing_price.toLocaleString()}</span>
                            </div>
                           
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Substation Max Voltage</span>
                              <span className="text-lg font-semibold text-foreground">{property.substation_max_voltage} kV</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
          {/* Call-to-action below demo */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Want access to the full platform with nationwide data?
              <a href="#signup" className="text-primary hover:underline ml-1 font-medium">
                Start your free search
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
