import { useState, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import { List, MapIcon, SlidersHorizontal, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import USListingCard from "@/components/listings/USListingCard";
import ListingsMap from "@/components/listings/ListingsMap";
import ListingsBreadcrumb from "@/components/listings/ListingsBreadcrumb";
import ListingsFooter from "@/components/listings/ListingsFooter";
import SubdivisionNav from "@/components/listings/SubdivisionNav";
import SampleReportModal from "@/components/listings/SampleReportModal";
import SEOHead from "@/components/listings/SEOHead";
import ListingsSEOContent from "@/components/listings/ListingsSEOContent";
import { generateListingSEODescription, generateListingKeywords } from "@/data/mockListings";
import { COUNTRIES, slugToCounty } from "@/data/locations";
import {
  useUSListingsNational,
  useUSListingsByState,
  useUSListingsByCounty,
  USListing,
} from "@/hooks/useUSListings";

// Helper to format slug to display name
const formatName = (slug: string) => {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Helper to get region/state name from slug
const getLocationName = (
  country?: string,
  region?: string,
  province?: string
) => {
  if (province) return formatName(province);
  if (region) {
    if (country === "united-states") {
      const state = COUNTRIES["united-states"].states.find(
        (s) => s.slug === region
      );
      return state?.name || formatName(region);
    }
    if (country === "italy") {
      const italyRegion = COUNTRIES["italy"].regions.find(
        (r) => r.slug === region
      );
      return italyRegion?.name || formatName(region);
    }
    return formatName(region);
  }
  if (country === "united-states") return "United States";
  if (country === "italy") return "Italy";
  return "All Regions";
};

// Determine which rank to show based on URL depth
function getRankType(
  country?: string,
  region?: string,
  province?: string
): "global" | "state" | "county" {
  if (province) return "county";
  if (region) return "state";
  return "global";
}

// Italy Coming Soon component
const ItalyComingSoon = ({
  locationName,
  country,
  region,
  province,
}: {
  locationName: string;
  country?: string;
  region?: string;
  province?: string;
}) => {
  const seoTitle = `Solar Land in ${locationName} - Coming Soon | Sunnyplans`;
  const seoDescription = `Solar and BESS land opportunities in ${locationName}, Italy are coming soon. We're currently focused on the US market.`;

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords="Italy solar land, BESS Italy, solar farm Italy"
      />

      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <ListingsBreadcrumb
              country={country}
              region={region}
              province={province}
            />
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Coming Soon to {locationName}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              We're expanding our solar and BESS land database to Italy. Stay
              tuned for updates on available parcels in {locationName}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <a href="/united-states">Browse US Listings</a>
              </Button>
              <SampleReportModal>
                <Button variant="outline" size="lg">
                  See a Sample Report
                </Button>
              </SampleReportModal>
            </div>
          </div>

          <ListingsFooter
            currentCountry={country}
            currentRegion={region}
            currentProvince={province}
          />
        </main>
      </div>
    </>
  );
};

const ListingsSearch = () => {
  const { country, region, province } = useParams();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const isUS = country === "united-states";
  const isItaly = country === "italy";

  // Determine the level and use appropriate hook
  const isNational = isUS && !region;
  const isState = isUS && region && !province;
  const isCounty = isUS && region && province;

  // Fetch US listings based on URL depth
  const nationalQuery = useUSListingsNational(10);
  const stateQuery = useUSListingsByState(isState || isCounty ? region : undefined, 10);
  const countyQuery = useUSListingsByCounty(
    isCounty ? region : undefined,
    isCounty ? province : undefined,
    10
  );

  // Get the appropriate listings based on URL depth
  const usListings: USListing[] = useMemo(() => {
    if (isCounty && countyQuery.data) return countyQuery.data;
    if (isState && stateQuery.data) return stateQuery.data;
    if (isNational && nationalQuery.data) return nationalQuery.data;
    return [];
  }, [isNational, isState, isCounty, nationalQuery.data, stateQuery.data, countyQuery.data]);

  const isLoading = isNational
    ? nationalQuery.isLoading
    : isState
    ? stateQuery.isLoading
    : isCounty
    ? countyQuery.isLoading
    : false;

  // Format location name for display
  const locationName = getLocationName(country, region, province);
  const parentName = province
    ? getLocationName(country, region)
    : country === "italy"
    ? "Italy"
    : "United States";

  // Check if we have zero results
  const hasNoResults = usListings.length === 0 && !isLoading;

  // SEO data
  const seoTitle = `Substation-Ready Land for BESS & Solar in ${locationName} | Sunnyplans`;
  const seoDescription = generateListingSEODescription(
    locationName,
    usListings.length,
    parentName
  );
  const seoKeywordsStr = generateListingKeywords(
    locationName,
    region ? getLocationName(country, region) : undefined
  );

  // Build canonical URL
  const buildCanonicalUrl = () => {
    const base = "https://sunnyplans.com";
    const pathParts = [country, region, province].filter(Boolean);
    if (pathParts.length === 0) return base;
    return `${base}/${pathParts.join("/")}`;
  };
  const canonicalUrl = buildCanonicalUrl();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Substation-Ready Solar Land in ${locationName}`,
    description: seoDescription,
    numberOfItems: usListings.length,
    itemListElement: usListings.slice(0, 10).map((listing, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "RealEstateListing",
        name: `Solar Land in ${listing.county}, ${listing.state_code}`,
        description: `${listing.lot_acres} acre land with ${Math.round((listing.prob_solar || 0) * 100)}% solar probability. Pre-vetted for grid connection.`,
      },
    })),
  };

  // Rank type for cards
  const rankType = getRankType(country, region, province);

  // If Italy, show coming soon
  if (isItaly) {
    return (
      <ItalyComingSoon
        locationName={locationName}
        country={country}
        region={region}
        province={province}
      />
    );
  }

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywordsStr}
        canonicalUrl={canonicalUrl}
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
            />

            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {hasNoResults ? (
                    <>
                      Solar Land Opportunities near{" "}
                      <span className="text-primary">{locationName}</span>
                    </>
                  ) : (
                    <>
                      Top Rated Solar Land in{" "}
                      <span className="text-primary">{locationName}</span>
                    </>
                  )}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isLoading ? (
                    "Loading listings..."
                  ) : hasNoResults ? (
                    `We found 0 exact matches in ${locationName}, but here are opportunities in the surrounding area.`
                  ) : (
                    <>
                      Showing <strong>{usListings.length}</strong> top-ranked
                      parcels sorted by solar probability
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
                  Showing <strong>{usListings.length}</strong> results, sorted
                  by {rankType === "global" ? "national" : rankType} rank
                </p>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-48 bg-muted animate-pulse rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {usListings.map((listing) => (
                    <USListingCard
                      key={listing.land_id}
                      listing={listing}
                      showRank={rankType}
                    />
                  ))}
                </div>
              )}

              {!isLoading && usListings.length === 0 && (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">
                    No listings found in this area yet.
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
                  listingCount={usListings.length}
                  usListings={usListings}
                />
              </div>
            </div>
          </div>

          {/* Subdivision Navigation */}
          <SubdivisionNav country={country} region={region} province={province} />

          {/* SEO Content Section */}
          <ListingsSEOContent
            locationName={locationName}
            listingsCount={usListings.length}
          />

          {/* Footer with regional links */}
          <ListingsFooter
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
              <>
                <MapIcon className="w-4 h-4 mr-2" /> Show Map
              </>
            ) : (
              <>
                <List className="w-4 h-4 mr-2" /> Show List
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default ListingsSearch;
