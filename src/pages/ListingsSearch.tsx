import { useState } from "react";
import { useParams } from "react-router-dom";
import { List, MapIcon, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ListingsBreadcrumb from "@/components/listings/ListingsBreadcrumb";
import ListingsFooter from "@/components/listings/ListingsFooter";
import SubdivisionNav from "@/components/listings/SubdivisionNav";
import SampleReportModal from "@/components/listings/SampleReportModal";
import ScheduleCallPopup from "@/components/listings/ScheduleCallPopup";
import SEOHead from "@/components/listings/SEOHead";
import ListingsSEOContent from "@/components/listings/ListingsSEOContent";
import { useListingViewCounter } from "@/hooks/useListingViewCounter";
import { getCountryAdapter, type CountryAdapter } from "@/countries";

const LIMIT = 10;

const ListingsSearch = () => {
  const { country, region, province } = useParams();
  const adapter = getCountryAdapter(country);
  if (!adapter) return <CountryNotSupported slug={country} />;
  return (
    <CountryListingsSearch
      adapter={adapter}
      country={country!}
      region={region}
      province={province}
    />
  );
};

interface InnerProps {
  adapter: CountryAdapter;
  country: string;
  region?: string;
  province?: string;
}

const CountryListingsSearch = ({ adapter, country, region, province }: InnerProps) => {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const { shouldShowPopup, closePopup } = useListingViewCounter();

  const scope = adapter.parseScope({ region, province });
  const listingsQuery = adapter.useListings(scope, LIMIT);
  const heatmapQuery = adapter.useHeatmap(showHeatmap);

  const listings = listingsQuery.data ?? [];
  const isLoading = listingsQuery.isLoading;

  const locationName = adapter.formatScopeName(scope);
  const sortLabel = adapter.rankSortLabel(scope);
  const hasNoResults = listings.length === 0 && !isLoading;

  const seo = adapter.seoCopy(scope, listings);
  const canonicalUrl = buildCanonicalUrl(country, region, province);

  return (
    <>
      <SEOHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonicalUrl={canonicalUrl}
        structuredData={seo.structuredData}
      />

      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <ListingsBreadcrumb country={country} region={region} province={province} />

            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {hasNoResults ? adapter.heading.nearLocation : adapter.heading.topRated}{" "}
                  <span className="text-primary">{locationName}</span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isLoading ? (
                    "Loading listings..."
                  ) : hasNoResults ? (
                    `We found 0 exact matches in ${locationName}, but here are opportunities in the surrounding area.`
                  ) : (
                    <>
                      Showing <strong>{listings.length}</strong> top-ranked{" "}
                      {adapter.listingTerm} sorted by solar probability
                    </>
                  )}
                </p>
              </div>

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

              <div className="hidden md:flex items-center gap-2">
                <SampleReportModal country={country === "italy" ? "it" : "us"}>
                  <Button variant="outline" size="sm">
                    {country === "italy" ? "Vedi Report di Esempio" : "See a Sample Report"}
                  </Button>
                </SampleReportModal>
                <Button variant="outline" size="sm" disabled>
                  <SlidersHorizontal className="w-4 h-4 mr-1" /> Filters (Pro)
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className={cn("lg:w-[45%] xl:w-[40%]", viewMode === "map" && "hidden lg:block")}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing <strong>{listings.length}</strong> results, sorted by {sortLabel} rank
                </p>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {listings.map((listing, index) => adapter.renderListingCard(listing, scope, index))}
                </div>
              )}

              {!isLoading && listings.length === 0 && (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">No listings found in this area yet.</p>
                </div>
              )}
            </div>

            <div
              className={cn(
                "lg:w-[55%] xl:w-[60%] lg:sticky lg:top-4 lg:self-start",
                viewMode === "list" && "hidden lg:block"
              )}
            >
              <div className="h-[400px] lg:h-[calc(100vh-200px)] rounded-lg overflow-hidden border border-border">
                {adapter.renderMap({
                  listings,
                  scope,
                  hexCells: heatmapQuery.data,
                  showHeatmap,
                  hexLoading: showHeatmap && heatmapQuery.isLoading,
                  onToggleHeatmap: () => setShowHeatmap(v => !v),
                })}
              </div>
            </div>
          </div>

          <SubdivisionNav country={country} region={region} province={province} />

          <ListingsSEOContent locationName={locationName} listingsCount={listings.length} />

          <ListingsFooter currentCountry={country} currentRegion={region} currentProvince={province} />
        </main>

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

const CountryNotSupported = ({ slug }: { slug?: string }) => (
  <div className="container mx-auto px-4 py-12 text-center">
    <h1 className="text-2xl font-bold">Country not supported</h1>
    <p className="text-muted-foreground mt-2">
      We don't have listings for {slug ?? "this region"} yet.
    </p>
  </div>
);

function buildCanonicalUrl(country: string, region?: string, province?: string): string {
  const base = "https://sunnyplans.com";
  const parts = [country, region, province].filter(Boolean);
  return parts.length === 0 ? base : `${base}/${parts.join("/")}`;
}

export default ListingsSearch;
