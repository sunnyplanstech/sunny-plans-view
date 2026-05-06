// Layer-first listings preview (roadmap p1-e3-layer-first-ui).
// Parallel to ListingsSearch.tsx — when this UX is approved, we
// promote it behind the layer-first-layout feature flag and retire
// the old page. Until then, this lives at /preview/:country/...
//
// Layout: page-level LayerPanel on the left rail drives both the
// listings query (via per-layer filter params) and the map overlay
// selection (page-controlled, in-map LayerPanel rows hidden).
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Layers, List, MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ListingsBreadcrumb from "@/components/listings/ListingsBreadcrumb";
import ListingsFooter from "@/components/listings/ListingsFooter";
import SubdivisionNav from "@/components/listings/SubdivisionNav";
import SEOHead from "@/components/listings/SEOHead";
import { getCountryAdapter, type CountryAdapter } from "@/countries";
import {
  availableLayers,
  layersInVertical,
  listingsParamsFor,
  selectedOverlayIds,
  type CountrySlug,
  type Layer,
  type Vertical,
} from "@/components/layers/registry";
import PageLayerPanel from "@/components/layers/PageLayerPanel";
import LayerChips from "@/components/layers/LayerChips";

const LIMIT = 20;

const ListingsSearchPreview = () => {
  const { country, region, province } = useParams();
  const adapter = getCountryAdapter(country);
  if (!adapter || (country !== "united-states" && country !== "italy")) {
    return <CountryNotSupported slug={country} />;
  }
  return (
    <CountryListingsPreview
      adapter={adapter}
      country={country as CountrySlug}
      region={region}
      province={province}
    />
  );
};

interface InnerProps {
  adapter: CountryAdapter;
  country: CountrySlug;
  region?: string;
  province?: string;
}

const CountryListingsPreview = ({
  adapter,
  country,
  region,
  province,
}: InnerProps) => {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [panelOpen, setPanelOpen] = useState(false);

  const layers = useMemo(() => availableLayers(country), [country]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectBundle = useCallback(
    (vertical: Vertical) => {
      const inBundle = layersInVertical(layers, vertical);
      const allOn = inBundle.every((l) => selectedIds.has(l.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const layer of inBundle) {
          if (allOn) next.delete(layer.id);
          else next.add(layer.id);
        }
        return next;
      });
    },
    [layers, selectedIds],
  );

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const selectedLayers = useMemo<Layer[]>(
    () => layers.filter((l) => selectedIds.has(l.id)),
    [layers, selectedIds],
  );

  const extraParams = useMemo(
    () => listingsParamsFor(selectedIds, layers),
    [selectedIds, layers],
  );
  const overlayIds = useMemo(
    () => selectedOverlayIds(selectedIds, layers),
    [selectedIds, layers],
  );

  const scope = adapter.parseScope({ region, province });
  const listingsQuery = adapter.useListings(scope, LIMIT, extraParams);
  const heatmapQuery = adapter.useHeatmap(false);
  const listings = listingsQuery.data ?? [];
  const isLoading = listingsQuery.isLoading;

  const locationName = adapter.formatScopeName(scope);
  const seo = adapter.seoCopy(scope, listings);
  const canonicalUrl = buildCanonicalUrl(country, region, province);

  const hasRegionScope = !!region;
  const filterCount = selectedLayers.filter((l) => l.listingsFilter).length;

  return (
    <>
      <SEOHead
        title={`[Preview] ${seo.title}`}
        description={seo.description}
        keywords={seo.keywords}
        canonicalUrl={canonicalUrl}
        structuredData={seo.structuredData}
      />

      <div className="min-h-screen bg-background">
        <PreviewBanner />

        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <ListingsBreadcrumb
              country={country}
              region={region}
              province={province}
            />
            <div className="mt-3 flex flex-col gap-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {selectedIds.size === 0
                  ? "Baseline view · no filters"
                  : `${selectedIds.size} layer${selectedIds.size > 1 ? "s" : ""} active${filterCount > 0 ? ` · ${filterCount} filter${filterCount > 1 ? "s" : ""}` : ""}`}
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                {selectedIds.size === 0 ? "All " : `${listings.length} `}
                <span className="font-normal text-muted-foreground">
                  {adapter.listingTerm} in
                </span>{" "}
                <span className="text-primary">{locationName}</span>
              </h1>
              {selectedLayers.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    With:
                  </span>
                  {selectedLayers.map((l) => (
                    <span
                      key={l.id}
                      className="inline-flex items-center rounded-sm border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] text-foreground"
                    >
                      {l.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Left rail — layer panel. Sticky on lg+, drawer on mobile. */}
            <div
              className={cn(
                "lg:sticky lg:top-4 lg:self-start lg:w-[280px] xl:w-[300px] lg:flex-shrink-0",
                panelOpen ? "block" : "hidden lg:block",
              )}
            >
              <PageLayerPanel
                layers={layers}
                selectedIds={selectedIds}
                onToggle={toggle}
                onSelectBundle={selectBundle}
                onClear={clear}
                hasRegionScope={hasRegionScope}
              />
            </div>

            {/* Middle — listings */}
            <div
              className={cn(
                "flex-1 min-w-0",
                viewMode === "map" && "hidden lg:block",
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {isLoading
                    ? "loading…"
                    : `${listings.length} result${listings.length === 1 ? "" : "s"}`}
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
              ) : listings.length === 0 ? (
                <EmptyState selectedCount={selectedIds.size} onClear={clear} />
              ) : (
                <div className="space-y-4">
                  {listings.map((listing, i) => (
                    <div key={listing.id} className="space-y-1.5">
                      <LayerChips
                        listing={listing}
                        selectedLayers={selectedLayers}
                        className="px-1"
                      />
                      {adapter.renderListingCard(listing, scope, i)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right — map */}
            <div
              className={cn(
                "lg:w-[42%] xl:w-[44%] lg:sticky lg:top-4 lg:self-start",
                viewMode === "list" && "hidden lg:block",
              )}
            >
              <div className="h-[400px] lg:h-[calc(100vh-180px)] rounded-lg overflow-hidden border border-border">
                {adapter.renderMap({
                  listings,
                  scope,
                  hexCells: heatmapQuery.data,
                  showHeatmap: false,
                  hexLoading: false,
                  pageControlledOverlayIds: overlayIds,
                })}
              </div>
            </div>
          </div>

          <SubdivisionNav
            country={country}
            region={region}
            province={province}
          />

          <ListingsFooter
            currentCountry={country}
            currentRegion={region}
            currentProvince={province}
          />
        </main>

        {/* Mobile floating controls */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden z-50 flex gap-2">
          <Button
            size="lg"
            variant="outline"
            className="shadow-lg bg-background"
            onClick={() => setPanelOpen((o) => !o)}
          >
            <Layers className="w-4 h-4 mr-2" />
            Layers{selectedIds.size > 0 && ` · ${selectedIds.size}`}
          </Button>
          <Button
            size="lg"
            className="shadow-lg"
            onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
          >
            {viewMode === "list" ? (
              <>
                <MapIcon className="w-4 h-4 mr-2" /> Map
              </>
            ) : (
              <>
                <List className="w-4 h-4 mr-2" /> List
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

const PreviewBanner = () => (
  <div className="border-b border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
    <div className="container mx-auto px-4 py-2 flex items-center gap-3">
      <span className="inline-flex items-center rounded-sm bg-amber-500 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
        Preview
      </span>
      <p className="text-xs text-amber-900 dark:text-amber-200">
        Layer-first listings UI · roadmap{" "}
        <code className="font-mono">p1-e3-layer-first-ui</code> · not yet on
        production routes
      </p>
    </div>
  </div>
);

const EmptyState = ({
  selectedCount,
  onClear,
}: {
  selectedCount: number;
  onClear: () => void;
}) => (
  <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed border-border">
    <p className="text-sm text-muted-foreground">
      {selectedCount === 0
        ? "No listings found in this area yet."
        : "No listings match the selected layers in this area."}
    </p>
    {selectedCount > 0 && (
      <Button
        variant="link"
        size="sm"
        onClick={onClear}
        className="mt-2"
      >
        Clear layers
      </Button>
    )}
  </div>
);

const CountryNotSupported = ({ slug }: { slug?: string }) => (
  <div className="container mx-auto px-4 py-12 text-center">
    <h1 className="text-2xl font-bold">Country not supported</h1>
    <p className="text-muted-foreground mt-2">
      We don't have listings for {slug ?? "this region"} yet.
    </p>
  </div>
);

function buildCanonicalUrl(
  country: string,
  region?: string,
  province?: string,
): string {
  const base = "https://sunnyplans.com";
  const parts = ["preview", country, region, province].filter(Boolean);
  return `${base}/${parts.join("/")}`;
}

export default ListingsSearchPreview;
