import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUSListingsNational } from "@/hooks/useUSListings";
import USListingCard from "@/components/listings/USListingCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const DemoSection = () => {
  const { data: listings, isLoading } = useUSListingsNational(5);

  if (isLoading) {
    return (
      <section id="demo" className="py-16 md:py-24 bg-background">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Skeleton className="h-10 w-80 mx-auto mb-4" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            <Skeleton className="h-48 w-full" />
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
              Top Rated Solar Land Nationwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our highest-ranked parcels, pre-vetted for solar and BESS development potential.
            </p>
          </div>

          {/* Listings Carousel */}
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {listings?.map((listing) => (
                <CarouselItem key={listing.land_id} className="pl-2 md:pl-4 md:basis-1/2">
                  <USListingCard
                    listing={listing}
                    showRank="global"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12" />
            <CarouselNext className="hidden md:flex -right-12" />
          </Carousel>

          {/* Mobile swipe hint */}
          <p className="text-center text-sm text-muted-foreground mt-4 md:hidden">
            Swipe to see more listings
          </p>

          {/* Call-to-action below listings */}
          <div className="text-center mt-10">
            <Button asChild size="lg" className="group">
              <Link to="/united-states" className="flex items-center gap-2">
                Browse All Listings
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Want access to the full platform with nationwide data?
              <a href="#pricing" className="text-primary hover:underline ml-1 font-medium">
                See pricing plans
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
