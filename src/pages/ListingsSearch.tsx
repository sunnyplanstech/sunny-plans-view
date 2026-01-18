import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { List, MapIcon, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ListingCard from "@/components/listings/ListingCard";
import ListingsMap from "@/components/listings/ListingsMap";
import ListingsBreadcrumb from "@/components/listings/ListingsBreadcrumb";
import NearbyListings from "@/components/listings/NearbyListings";
import SampleReportModal from "@/components/listings/SampleReportModal";
import SEOHead from "@/components/listings/SEOHead";
import { getListingsByLocation, locationHierarchy } from "@/data/mockListings";

const ListingsSearch = () => {
  const { country, region, province, municipality } = useParams();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Fetch listings based on URL params
  const listings = useMemo(() => {
    return getListingsByLocation(country, region, province, municipality);
  }, [country, region, province, municipality]);

  // Get location stats
  const locationStats = useMemo(() => {
    const matchingLocation = locationHierarchy.find(loc => {
      if (province) return loc.province?.toLowerCase() === province.toLowerCase();
      if (region) return loc.region.toLowerCase() === region.toLowerCase();
      if (country) return loc.country === country;
      return false;
    });
    return matchingLocation || { avgDistanceToSubstation: "varies", rating: "good" as const };
  }, [country, region, province]);

  // Format location name for display
  const locationName = province || region || (country === "italy" ? "Italy" : country === "usa" ? "USA" : "All Regions");
  const parentName = province ? region : country === "italy" ? "Italy" : "USA";

  // Check if we have zero results
  const hasNoResults = listings.length === 0;

  // SEO data
  const seoTitle = `Top Rated Solar Land for Sale in ${locationName} | Sunnyplans`;
  const seoDescription = `Explore ${listings.length} off-market solar & BESS opportunities in ${locationName}${parentName ? `, ${parentName}` : ""}. Vetted for grid connection and constraints. View SunnyScores™ now.`;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Solar Land Listings in ${locationName}`,
    "description": seoDescription,
    "numberOfItems": listings.length,
    "itemListElement": listings.slice(0, 10).map((listing, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "RealEstateListing",
        "name": `Solar Land in ${listing.province}, ${listing.region}`,
        "description": `${listing.size} ${listing.country === "italy" ? "hectare" : "acre"} ${listing.landType} land with SunnyScore ${listing.sunnyScore}/100`,
      }
    }))
  };

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={`solar land, renewable energy, ${locationName}, land for sale, photovoltaic, BESS, grid connection`}
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <ListingsBreadcrumb 
              country={country}
              region={region}
              province={province}
              municipality={municipality}
            />
            
            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {hasNoResults ? (
                    <>Solar Land Opportunities near <span className="text-primary">{locationName}</span></>
                  ) : (
                    <>Top Rated Solar Land in <span className="text-primary">{locationName}</span></>
                  )}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {hasNoResults ? (
                    `We found 0 exact matches in ${locationName}, but here are opportunities in the surrounding area.`
                  ) : (
                    <>
                      In {locationName}, the average distance to a substation is <strong>{locationStats.avgDistanceToSubstation}</strong>, 
                      making it <strong>{locationStats.rating}</strong> for interconnection.
                    </>
                  )}
                </p>
              </div>

              {/* View toggle (mobile) */}
              <div className="flex items-center gap-2 md:hidden">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4 mr-1" /> List
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                >
                  <MapIcon className="w-4 h-4 mr-1" /> Map
                </Button>
              </div>

              {/* Desktop actions */}
              <div className="hidden md:flex items-center gap-2">
                <SampleReportModal>
                  <Button variant="outline" size="sm">
                    See a Sample Report
                  </Button>
                </SampleReportModal>
                <Button variant="outline" size="sm" disabled>
                  <SlidersHorizontal className="w-4 h-4 mr-1" /> Filters (Pro)
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content - Split view on desktop */}
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left pane - List */}
            <div 
              className={cn(
                "lg:w-[45%] xl:w-[40%]",
                viewMode === "map" && "hidden lg:block"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing <strong>{listings.length}</strong> results, sorted by SunnyScore™
                </p>
              </div>

              <div className="grid gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {listings.length === 0 && (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">
                    No exact matches found. Showing nearby opportunities below.
                  </p>
                </div>
              )}
            </div>

            {/* Right pane - Map */}
            <div 
              className={cn(
                "lg:w-[55%] xl:w-[60%] lg:sticky lg:top-4 lg:self-start",
                viewMode === "list" && "hidden lg:block"
              )}
            >
              <div className="h-[400px] lg:h-[calc(100vh-200px)] rounded-lg overflow-hidden border border-border">
                <ListingsMap
                  country={country}
                  region={region}
                  province={province}
                  listingCount={listings.length}
                />
              </div>
            </div>
          </div>

          {/* Nearby listings for internal linking */}
          <NearbyListings
            currentCountry={country}
            currentRegion={region}
            currentProvince={province}
          />
        </main>

        {/* Mobile FAB for view toggle */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden z-50">
          <Button
            size="lg"
            className="shadow-lg"
            onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
          >
            {viewMode === "list" ? (
              <><MapIcon className="w-4 h-4 mr-2" /> Show Map</>
            ) : (
              <><List className="w-4 h-4 mr-2" /> Show List</>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default ListingsSearch;
