import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { List, MapIcon, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import USListingCard from "@/components/listings/USListingCard";
import ITListingCard from "@/components/listings/ITListingCard";
import ListingsMap from "@/components/listings/ListingsMap";
import ListingsBreadcrumb from "@/components/listings/ListingsBreadcrumb";
import ListingsFooter from "@/components/listings/ListingsFooter";
import SubdivisionNav from "@/components/listings/SubdivisionNav";
import SampleReportModal from "@/components/listings/SampleReportModal";
import ScheduleCallPopup from "@/components/listings/ScheduleCallPopup";
import SEOHead from "@/components/listings/SEOHead";
import ListingsSEOContent from "@/components/listings/ListingsSEOContent";
import { generateListingSEODescription, generateListingKeywords } from "@/data/mockListings";
import { COUNTRIES } from "@/data/locations";
import {
  useUSListingsNational,
  useUSListingsByState,
  useUSListingsByCounty,
  USListing,
} from "@/hooks/useUSListings";
import {
  useITListingsNational,
  useITListingsByRegion,
  useITListingsByComune,
  ITListing,
} from "@/hooks/useITListings";
import { useUSCounty, useITComune } from "@/hooks/useLocationData";
import { useUSHexHeatmap, useITHexHeatmap } from "@/hooks/useHexHeatmap";
import { useListingViewCounter } from "@/hooks/useListingViewCounter";

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
function getUSRankType(
  region?: string,
  province?: string
): "global" | "state" | "county" {
  if (province) return "county";
  if (region) return "state";
  return "global";
}

function getITRankType(
  region?: string,
  province?: string
): "global" | "region" | "comune" {
  if (province) return "comune";
  if (region) return "region";
  return "global";
}

const ListingsSearch = () => {
  const { country, region, province } = useParams();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const { shouldShowPopup, closePopup } = useListingViewCounter();

  const isUS = country === "united-states";
  const isItaly = country === "italy";

  // US levels
  const isUSNational = isUS && !region;
  const isUSState = isUS && !!region && !province;
  const isUSCounty = isUS && !!region && !!province;

  // Italy levels
  const isITNational = isItaly && !region;
  const isITRegion = isItaly && !!region && !province;
  const isITComune = isItaly && !!region && !!province;

  // Fetch US listings based on URL depth
  const nationalQuery = useUSListingsNational(10);
  const stateQuery = useUSListingsByState(isUSState || isUSCounty ? region : undefined, 10);
  const countyQuery = useUSListingsByCounty(
    isUSCounty ? region : undefined,
    isUSCounty ? province : undefined,
    10
  );

  // Fetch Italian listings based on URL depth
  const itNationalQuery = useITListingsNational(10);
  const itRegionQuery = useITListingsByRegion(isITRegion || isITComune ? region : undefined, 10);
  const itComuneQuery = useITListingsByComune(isITComune ? province : undefined, 10);

  // Fetch hex heatmap data (lazy — only when toggled on)
  const usHexQuery = useUSHexHeatmap(showHeatmap && isUS);
  const itHexQuery = useITHexHeatmap(showHeatmap && isItaly);
  const hexCells = isUS ? usHexQuery.data : isItaly ? itHexQuery.data : undefined;
  const hexLoading = showHeatmap && (isUS ? usHexQuery.isLoading : isItaly ? itHexQuery.isLoading : false);

  // Fetch county/comune-level SEO stats
  const countyStatsQuery = useUSCounty(isUSCounty ? region : undefined, isUSCounty ? province : undefined);
  const countyStats = countyStatsQuery.data;
  const comuneStatsQuery = useITComune(isITComune ? province : undefined);
  const comuneStats = comuneStatsQuery.data;

  // Get the appropriate US listings
  const usListings: USListing[] = useMemo(() => {
    if (isUSCounty && countyQuery.data) return countyQuery.data;
    if (isUSState && stateQuery.data) return stateQuery.data;
    if (isUSNational && nationalQuery.data) return nationalQuery.data;
    return [];
  }, [isUSNational, isUSState, isUSCounty, nationalQuery.data, stateQuery.data, countyQuery.data]);

  // Get the appropriate IT listings
  const itListings: ITListing[] = useMemo(() => {
    if (isITComune && itComuneQuery.data) return itComuneQuery.data;
    if (isITRegion && itRegionQuery.data) return itRegionQuery.data;
    if (isITNational && itNationalQuery.data) return itNationalQuery.data;
    return [];
  }, [isITNational, isITRegion, isITComune, itNationalQuery.data, itRegionQuery.data, itComuneQuery.data]);

  const isLoading = isUS
    ? (isUSNational ? nationalQuery.isLoading : isUSState ? stateQuery.isLoading : isUSCounty ? countyQuery.isLoading : false)
    : isItaly
    ? (isITNational ? itNationalQuery.isLoading : isITRegion ? itRegionQuery.isLoading : isITComune ? itComuneQuery.isLoading : false)
    : false;

  const totalListings = isUS ? usListings : itListings;

  // Format location name for display
  const locationName = getLocationName(country, region, province);
  const parentName = province
    ? getLocationName(country, region)
    : country === "italy"
    ? "Italy"
    : "United States";

  const hasNoResults = totalListings.length === 0 && !isLoading;

  // SEO data
  const listingCountForSEO = isItaly
    ? (comuneStats?.listing_count || itListings.length)
    : (countyStats?.listing_count || usListings.length);

  const seoTitle = isItaly
    ? `Terreni per Fotovoltaico e BESS in ${locationName} | Sunnyplans`
    : `Substation-Ready Land for BESS & Solar in ${locationName} | Sunnyplans`;

  const seoDescription = isItaly
    ? (comuneStats
      ? `Scopri ${comuneStats.listing_count} particelle catastali per fotovoltaico in ${locationName}, ${parentName}. Probabilità solare media: ${Math.round((comuneStats.avg_prob_solar || 0) * 100)}%. Pre-analizzate per BESS e solare.`
      : `Particelle catastali per fotovoltaico e BESS in ${locationName}, ${parentName}. Analisi solare e vicinanza alle sottostazioni elettriche.`)
    : (countyStats
      ? `Discover ${countyStats.listing_count} solar land opportunities in ${locationName}, ${parentName}. Avg solar probability: ${Math.round((countyStats.avg_prob_solar || 0) * 100)}%. Land from ${countyStats.min_price_bucket ?? "N/A"}. Pre-vetted for BESS & solar.`
      : generateListingSEODescription(locationName, usListings.length, parentName));

  const seoKeywordsStr = isItaly
    ? `terreni fotovoltaico ${locationName}, BESS Italia, solare ${locationName}, particelle catastali fotovoltaico`
    : generateListingKeywords(
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

  const structuredData = isItaly
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Particelle Catastali per Fotovoltaico in ${locationName}`,
        description: seoDescription,
        numberOfItems: listingCountForSEO,
        itemListElement: itListings.slice(0, 10).map((listing, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            name: `Solar Parcel - ${listing.comune_name}`,
            description: `Particella catastale con ${Math.round((listing.prob_solar || 0) * 100)}% probabilità solare. Pre-analizzata per connessione alla rete.`,
          },
        })),
      }
    : {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Substation-Ready Solar Land in ${locationName}`,
        description: seoDescription,
        numberOfItems: listingCountForSEO,
        ...(countyStats && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Math.round((countyStats.avg_prob_solar || 0) * 100),
            bestRating: 100,
            worstRating: 0,
            ratingCount: countyStats.listing_count,
          },
        }),
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

  // Rank types
  const usRankType = getUSRankType(region, province);
  const itRankType = getITRankType(region, province);

  // Terminology
  const listingTerm = isItaly ? "particelle" : "parcels";
  const sortLabel = isItaly
    ? (isITComune ? "comune" : isITRegion ? "region" : "national")
    : (usRankType === "global" ? "national" : usRankType);

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
                      {isItaly ? "Particelle Catastali near" : "Solar Land Opportunities near"}{" "}
                      <span className="text-primary">{locationName}</span>
                    </>
                  ) : (
                    <>
                      {isItaly ? "Top Rated Particelle in" : "Top Rated Solar Land in"}{" "}
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
                      Showing <strong>{totalListings.length}</strong> top-ranked
                      {" "}{listingTerm} sorted by solar probability
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
                  Showing <strong>{totalListings.length}</strong> results, sorted
                  by {sortLabel} rank
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
                  {isUS && usListings.map((listing) => (
                    <USListingCard
                      key={listing.id}
                      listing={listing}
                      showRank={usRankType}
                    />
                  ))}
                  {isItaly && itListings.map((listing, index) => (
                    <ITListingCard
                      key={listing.id}
                      listing={listing}
                      showRank={itRankType}
                      listPosition={index + 1}
                    />
                  ))}
                </div>
              )}

              {!isLoading && totalListings.length === 0 && (
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
                  listingCount={totalListings.length}
                  usListings={usListings}
                  itListings={itListings}
                  hexCells={hexCells}
                  showHeatmap={showHeatmap}
                  hexLoading={hexLoading}
                  onToggleHeatmap={() => setShowHeatmap((v) => !v)}
                />
              </div>
            </div>
          </div>

          {/* Subdivision Navigation */}
          <SubdivisionNav country={country} region={region} province={province} />

          {/* SEO Content Section */}
          <ListingsSEOContent
            locationName={locationName}
            listingsCount={totalListings.length}
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

      <ScheduleCallPopup open={shouldShowPopup} onClose={closePopup} />
    </>
  );
};

export default ListingsSearch;
