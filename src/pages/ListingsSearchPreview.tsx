// Layer-first listings preview (roadmap p1-e3-layer-first-ui).
//
// Lives at /preview/:country/... while the design is being validated;
// once promoted, this UX takes over /:country/... and the legacy
// `ListingsSearch.tsx` retires. Production routes are unaffected
// during the preview phase.
//
// The page composes three surfaces:
//   - ConstraintBar (left rail) — primary control surface, sticky
//     on lg+, becomes a single-surface drawer on mobile.
//   - Map (center, protagonist) — receives layer overlay selection
//     via pageControlledOverlayIds; reports zoom back via onZoomChange
//     so the constraint bar can show "zoom in to apply" hints.
//   - Listings rail (right rail) — collapsible side panel showing the
//     qualifying parcels under the current constraint stack. A toggle
//     expands it to full-width over the map for linear scanning.
//
// Constraint filtering runs client-side via `evaluateLayer` against
// the per-listing fields the API already returns (e.g. flat_5_acres
// for slope_lt_5). Layers without per-parcel flags (wetlands, PAD,
// Natura 2000) gate only the map overlay until the per-parcel
// constraint-flag pipeline lands (p1-e2-constraint-flags-on-parcels).
//
// Clicking a card opens the EvaluateDrawer over the map. In-map
// parcel-pin click routing to the same drawer is a separate slice.
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronRight, Layers, List, MapIcon, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ListingsBreadcrumb from "@/components/listings/ListingsBreadcrumb";
import ListingsFooter from "@/components/listings/ListingsFooter";
import SubdivisionNav from "@/components/listings/SubdivisionNav";
import SEOHead from "@/components/listings/SEOHead";
import EvaluateDrawer from "@/components/listings/EvaluateDrawer";
import SortSelector from "@/components/listings/SortSelector";
import {
  DEFAULT_SORT_KEY,
  sortListings,
  type SortKey,
} from "@/components/listings/sortListings";
import ConstraintBar from "@/components/layers/ConstraintBar";
import {
  availableLayers,
  selectedOverlayIds,
  type CountrySlug,
  type Layer,
} from "@/components/layers/registry";
import {
  effectFor,
  evaluateLayer,
  type LayerEffect,
} from "@/components/layers/evaluate";
import { getCountryAdapter, type CountryAdapter } from "@/countries";
import type { BaseListing } from "@/countries/types";

const LIMIT = 20;

// On mobile only one surface is visible at a time. Floating buttons
// at the bottom of the viewport rotate through these three.
type MobileSurface = "constraints" | "map" | "list";

const ListingsSearchPreview = () => {
  const { country, region, province } = useParams();
  const adapter = getCountryAdapter(country);
  if (!adapter || (country !== "united-states" && country !== "italy")) {
    return <CountryNotSupported slug={country} />;
  }
  return (
    <CountryPreview
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

const CountryPreview = ({ adapter, country, region, province }: InnerProps) => {
  const layers = useMemo(() => availableLayers(country), [country]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT_KEY);
  const [evaluating, setEvaluating] = useState<BaseListing | null>(null);
  const [listExpanded, setListExpanded] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const [mobileSurface, setMobileSurface] = useState<MobileSurface>("map");
  const [currentZoom, setCurrentZoom] = useState<number | undefined>(undefined);

  const toggleConstraint = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearConstraints = useCallback(() => setSelectedIds(new Set()), []);

  const selectedLayers = useMemo<Layer[]>(
    () => layers.filter((l) => selectedIds.has(l.id)),
    [layers, selectedIds],
  );

  const overlayIds = useMemo(
    () => selectedOverlayIds(selectedIds, layers),
    [selectedIds, layers],
  );

  const scope = adapter.parseScope({ region, province });
  const listingsQuery = adapter.useListings(scope, LIMIT);
  const heatmapQuery = adapter.useHeatmap(false);
  const allListings = useMemo(
    () => listingsQuery.data ?? [],
    [listingsQuery.data],
  );
  const isLoading = listingsQuery.isLoading;

  // Constraint bar effects use the unfiltered set so each row's "N
  // qualify" answers honestly across what the user could have seen.
  const effectsById = useMemo<Record<string, LayerEffect>>(() => {
    const out: Record<string, LayerEffect> = {};
    for (const layer of layers) {
      out[layer.id] = effectFor(allListings, layer);
    }
    return out;
  }, [layers, allListings]);

  // Listings rail shows the post-filter, post-sort set. A listing
  // passes the filter iff it passes every selected layer that can be
  // evaluated locally; layers without per-listing data don't filter
  // the list (they only drive the map overlay).
  const visibleListings = useMemo(() => {
    const evaluable = selectedLayers.filter((l) => l.chip);
    if (evaluable.length === 0) return sortListings(allListings, sortKey);
    const filtered = allListings.filter((listing) =>
      evaluable.every((layer) => evaluateLayer(listing, layer) === "pass"),
    );
    return sortListings(filtered, sortKey);
  }, [allListings, selectedLayers, sortKey]);

  const locationName = adapter.formatScopeName(scope);
  const seo = adapter.seoCopy(scope, visibleListings);
  const canonicalUrl = buildCanonicalUrl(country, region, province);
  const hasRegionScope = !!region;
  const drawerTitle = locationName;

  const handleSelectListing = useCallback(
    (listing: BaseListing) => setEvaluating(listing),
    [],
  );

  const constraintBar = (
    <ConstraintBar
      layers={layers}
      selectedIds={selectedIds}
      onToggle={toggleConstraint}
      onClear={clearConstraints}
      effectsById={effectsById}
      totalListings={allListings.length}
      currentZoom={currentZoom}
      hasRegionScope={hasRegionScope}
    />
  );

  const map = adapter.renderMap({
    listings: visibleListings,
    scope,
    hexCells: heatmapQuery.data,
    showHeatmap: false,
    hexLoading: false,
    pageControlledOverlayIds: overlayIds,
    onZoomChange: setCurrentZoom,
  });

  const listings = (
    <ListingsRail
      listings={visibleListings}
      total={allListings.length}
      isLoading={isLoading}
      sortKey={sortKey}
      onSortChange={setSortKey}
      adapter={adapter}
      scope={scope}
      onSelect={handleSelectListing}
      expanded={listExpanded}
      onToggleExpanded={() => setListExpanded((v) => !v)}
      selectedConstraintCount={selectedLayers.length}
      onClearConstraints={clearConstraints}
    />
  );

  return (
    <>
      <SEOHead
        title={`[Preview] ${seo.title}`}
        description={seo.description}
        keywords={seo.keywords}
        canonicalUrl={canonicalUrl}
        structuredData={seo.structuredData}
      />

      <div className="min-h-screen bg-background flex flex-col">
        <PreviewBanner />
        <PageHeader
          country={country}
          region={region}
          province={province}
          locationName={locationName}
          listingTerm={adapter.listingTerm}
          totalListings={allListings.length}
          visibleCount={visibleListings.length}
          selectedCount={selectedLayers.length}
        />

        {/* Desktop workspace — three columns, full-bleed within the
            viewport so the map can act as protagonist. */}
        <div
          className={cn(
            "hidden lg:flex flex-1 min-h-0 border-t border-border",
            // Each direct child gets its own scroll context; only the
            // map keeps a static height while listings + constraint
            // bar scroll independently.
          )}
        >
          {railOpen ? (
            <aside className="w-[300px] xl:w-[320px] flex-shrink-0 overflow-y-auto border-r border-border bg-muted/10 p-3">
              <RailToggleHeader
                label="Constraints"
                onCollapse={() => setRailOpen(false)}
              />
              {constraintBar}
            </aside>
          ) : (
            <button
              type="button"
              onClick={() => setRailOpen(true)}
              className="w-9 flex-shrink-0 border-r border-border bg-muted/10 hover:bg-muted/30 transition-colors flex items-start justify-center pt-4"
              aria-label="Show constraints"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {!listExpanded && (
            <section className="flex-1 min-w-0 relative">
              <div className="absolute inset-0">{map}</div>
            </section>
          )}

          <aside
            className={cn(
              "flex-shrink-0 border-l border-border bg-card overflow-hidden flex flex-col",
              listExpanded ? "flex-1 min-w-0" : "w-[360px] xl:w-[400px]",
            )}
          >
            {listings}
          </aside>
        </div>

        {/* Mobile workspace — single visible surface chosen by the
            floating segmented control at the bottom. */}
        <div className="flex-1 lg:hidden border-t border-border">
          {mobileSurface === "constraints" && (
            <div className="p-4">{constraintBar}</div>
          )}
          {mobileSurface === "map" && (
            <div className="h-[calc(100vh-220px)] min-h-[420px]">{map}</div>
          )}
          {mobileSurface === "list" && (
            <div className="h-[calc(100vh-220px)] min-h-[420px] overflow-y-auto">
              {listings}
            </div>
          )}
        </div>

        <div className="container mx-auto px-4 py-6">
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
        </div>

        <MobileSurfaceToggle
          surface={mobileSurface}
          onChange={setMobileSurface}
          constraintCount={selectedLayers.length}
        />
      </div>

      <EvaluateDrawer
        listing={evaluating}
        selectedLayers={selectedLayers}
        title={drawerTitle}
        onClose={() => setEvaluating(null)}
      />
    </>
  );
};

interface PageHeaderProps {
  country: string;
  region?: string;
  province?: string;
  locationName: string;
  listingTerm: string;
  totalListings: number;
  visibleCount: number;
  selectedCount: number;
}

const PageHeader = ({
  country,
  region,
  province,
  locationName,
  listingTerm,
  totalListings,
  visibleCount,
  selectedCount,
}: PageHeaderProps) => (
  <header className="border-b border-border bg-card">
    <div className="container mx-auto px-4 py-3">
      <ListingsBreadcrumb country={country} region={region} province={province} />
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          <span className="text-primary">{locationName}</span>{" "}
          <span className="font-normal text-muted-foreground">{listingTerm}</span>
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {selectedCount === 0
            ? `${totalListings} in scope · no constraints`
            : `${visibleCount} of ${totalListings} qualify · ${selectedCount} constraint${selectedCount > 1 ? "s" : ""}`}
        </p>
      </div>
    </div>
  </header>
);

const RailToggleHeader = ({
  label,
  onCollapse,
}: {
  label: string;
  onCollapse: () => void;
}) => (
  <div className="mb-2 flex items-center justify-between">
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </span>
    <button
      type="button"
      onClick={onCollapse}
      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      aria-label={`Collapse ${label.toLowerCase()}`}
    >
      <ChevronRight className="h-3.5 w-3.5 rotate-180" />
    </button>
  </div>
);

interface ListingsRailProps {
  listings: BaseListing[];
  total: number;
  isLoading: boolean;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  adapter: CountryAdapter;
  scope: ReturnType<CountryAdapter["parseScope"]>;
  onSelect: (listing: BaseListing) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  selectedConstraintCount: number;
  onClearConstraints: () => void;
}

const ListingsRail = ({
  listings,
  total,
  isLoading,
  sortKey,
  onSortChange,
  adapter,
  scope,
  onSelect,
  expanded,
  onToggleExpanded,
  selectedConstraintCount,
  onClearConstraints,
}: ListingsRailProps) => (
  <>
    <header className="border-b border-border px-4 py-3 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Listings
        </p>
        <p className="font-mono text-[11px] tabular-nums text-foreground">
          {isLoading
            ? "loading…"
            : selectedConstraintCount === 0
              ? `${total} in scope`
              : `${listings.length} of ${total} qualify`}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <SortSelector value={sortKey} onChange={onSortChange} />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleExpanded}
          aria-label={expanded ? "Collapse listings to rail" : "Expand listings full-width"}
        >
          {expanded ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </header>

    <div className="flex-1 overflow-y-auto p-4">
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          selectedCount={selectedConstraintCount}
          onClear={onClearConstraints}
        />
      ) : (
        <div
          className={cn(
            "space-y-4",
            expanded && "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 space-y-0",
          )}
        >
          {listings.map((listing, i) => (
            <div key={listing.id}>
              {adapter.renderListingCard(listing, scope, i, { onSelect })}
            </div>
          ))}
        </div>
      )}
    </div>
  </>
);

const MobileSurfaceToggle = ({
  surface,
  onChange,
  constraintCount,
}: {
  surface: MobileSurface;
  onChange: (s: MobileSurface) => void;
  constraintCount: number;
}) => (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:hidden z-40 inline-flex rounded-full border border-border bg-background shadow-lg overflow-hidden">
    <SurfaceButton
      active={surface === "constraints"}
      onClick={() => onChange("constraints")}
      icon={<Layers className="h-4 w-4" />}
      label={
        constraintCount > 0
          ? `Constraints · ${constraintCount}`
          : "Constraints"
      }
    />
    <SurfaceButton
      active={surface === "map"}
      onClick={() => onChange("map")}
      icon={<MapIcon className="h-4 w-4" />}
      label="Map"
    />
    <SurfaceButton
      active={surface === "list"}
      onClick={() => onChange("list")}
      icon={<List className="h-4 w-4" />}
      label="List"
    />
  </div>
);

const SurfaceButton = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-foreground hover:bg-muted",
    )}
    aria-pressed={active}
  >
    {icon}
    {label}
  </button>
);

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
        : "No listings qualify under the selected constraints."}
    </p>
    {selectedCount > 0 && (
      <Button variant="link" size="sm" onClick={onClear} className="mt-2">
        Clear constraints
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
