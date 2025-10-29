import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Sample data - you can add more properties to this array
const properties = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop",
    distanceToSubstation: 2.3,
    pricePerSqft: 1.25,
    listingPrice: 125000,
    substationMaxVoltage: 345
  }
];

const DemoSection = () => {
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
              Explore real land data and substation proximity analysis. This interactive demo shows exactly how we help you find the perfect site for your renewable energy projects.
            </p>
          </div>

          {/* Property Carousel */}
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {properties.map((property) => (
                <CarouselItem key={property.id}>
                  <Card className="border-border shadow-elegant">
                    <CardContent className="p-0">
                      <div className="grid md:grid-cols-2 gap-0">
                        {/* Image */}
                        <div className="relative h-64 md:h-full">
                          <img 
                            src={property.image} 
                            alt="Property" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Property Details */}
                        <div className="p-6 md:p-8 space-y-6">
                          <h3 className="text-2xl font-bold text-foreground">Property Details</h3>
                          
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-border">
                              <span className="text-muted-foreground">Distance to Substation</span>
                              <span className="text-lg font-semibold text-foreground">{property.distanceToSubstation} miles</span>
                            </div>
                            
                            <div className="flex justify-between items-center pb-3 border-b border-border">
                              <span className="text-muted-foreground">Price per Sqft</span>
                              <span className="text-lg font-semibold text-foreground">${property.pricePerSqft}</span>
                            </div>
                            
                            <div className="flex justify-between items-center pb-3 border-b border-border">
                              <span className="text-muted-foreground">Listing Price</span>
                              <span className="text-lg font-semibold text-foreground">${property.listingPrice.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Substation Max Voltage</span>
                              <span className="text-lg font-semibold text-foreground">{property.substationMaxVoltage} kV</span>
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
