import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { unitedStates, italy } from "@/countries";
import USListingCard from "@/components/listings/USListingCard";
import ITListingCard from "@/components/listings/ITListingCard";
import type { USListing } from "@/countries/unitedStates";
import type { ITListing } from "@/countries/italy";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const COUNTRIES = {
  us: {
    label: "United States",
    browsePath: "/solar/app/united-states",
    browseLabel: "Browse US Listings",
  },
  it: {
    label: "Italy",
    browsePath: "/solar/app/italy",
    browseLabel: "Browse Italy Listings",
  },
} as const;

type CountryKey = keyof typeof COUNTRIES;

const CarouselSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-48 w-full" />
  </div>
);

const DemoSection = () => {
  const [activeTab, setActiveTab] = useState<CountryKey>("us");
  const { data: usListingsRaw, isLoading: usLoading } = unitedStates.useListings(
    { level: "national" },
    5
  );
  const { data: itListingsRaw, isLoading: itLoading } = italy.useListings(
    { level: "national" },
    5
  );
  const usListings = usListingsRaw as USListing[] | undefined;
  const itListings = itListingsRaw as ITListing[] | undefined;

  const country = COUNTRIES[activeTab];

  return (
    <section id="demo" className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-text bg-clip-text text-transparent">
              Top Rated Solar Land
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our highest-ranked parcels, pre-vetted for solar and BESS development potential.
            </p>
          </div>

          {/* Country Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as CountryKey)}
            className="w-full"
          >
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="us">{COUNTRIES.us.label}</TabsTrigger>
                <TabsTrigger value="it">{COUNTRIES.it.label}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="us">
              {usLoading ? (
                <CarouselSkeleton />
              ) : (
                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {usListings?.map((listing) => (
                      <CarouselItem key={listing.id} className="pl-2 md:pl-4 md:basis-1/2">
                        <USListingCard listing={listing} showRank="global" />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden md:flex -left-12" />
                  <CarouselNext className="hidden md:flex -right-12" />
                </Carousel>
              )}
            </TabsContent>

            <TabsContent value="it">
              {itLoading ? (
                <CarouselSkeleton />
              ) : (
                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {itListings?.map((listing) => (
                      <CarouselItem key={listing.id} className="pl-2 md:pl-4 md:basis-1/2">
                        <ITListingCard listing={listing} showRank="global" />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden md:flex -left-12" />
                  <CarouselNext className="hidden md:flex -right-12" />
                </Carousel>
              )}
            </TabsContent>
          </Tabs>

          {/* Mobile swipe hint */}
          <p className="text-center text-sm text-muted-foreground mt-4 md:hidden">
            Swipe to see more listings
          </p>

          {/* Call-to-action below listings */}
          <div className="text-center mt-10">
            <Button asChild size="lg" className="group">
              <Link to={country.browsePath} className="flex items-center gap-2">
                {country.browseLabel}
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
