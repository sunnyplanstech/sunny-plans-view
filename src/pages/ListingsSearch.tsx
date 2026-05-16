// Layer-first listings page.
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
// Visual aesthetic — inherits the brand theme (gradient-subtle canvas,
// brand olive/citron, default shadcn radius). Sans-serif throughout;
// `tabular-nums` keeps counts aligned without dropping into monospace.
// `tp-mono` survives only on small `SLOPE` / `NWI` / `N2K` / `PAD`
// layer-identifier chips, where mono is the right idiom (these are
// stable code names, not user-facing copy). `tp-row` and `tp-hud` are
// retained for the constraint-row hover bar and the floating map HUD
// plates respectively.
//
// Constraint filtering runs client-side via `evaluateLayer` against
// the per-listing fields the API already returns (e.g. flat_5_acres
// for slope_lt_5). PAD, wetlands, and Natura 2000 are hard mart-level
// cuts (see Phase 3 comments in mart_us_listings.sql / mart_it_parcels.sql)
// — they appear as default-on, overlay-only toggles in ConstraintBar:
// the polygons paint as a "this is what we filtered out for you" trust
// signal, but flipping the toggle only hides the overlay; the qualifying
// cohort stays exactly the same.
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapHud } from "@/components/maps/MapHud";
import { pmtilesLayersFor } from "@/components/maps/pmtilesLayers";
import type {
  LayerProgress,
  PMTilesLayerState,
} from "@/components/maps/usePMTilesOverlays";
import {
  useUSCountyAggregate,
  useITProvinceAggregate,
} from "@/hooks/useAggregateChoropleth";
import {
  COUNTRIES,
  countyToSlug,
  slugToStateCode,
  stateCodeToSlug,
} from "@/data/locations";
import { ChevronRight, Layers, List, MapIcon, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ListingsBreadcrumb from "@/components/listings/ListingsBreadcrumb";
import ListingsFooter from "@/components/listings/ListingsFooter";
import ListingsSEOContent from "@/components/listings/ListingsSEOContent";
import SubdivisionNav from "@/components/listings/SubdivisionNav";
import SEOHead from "@/components/listings/SEOHead";
import EvaluateDrawer from "@/components/listings/EvaluateDrawer";
import SortSelector from "@/components/listings/SortSelector";
import { sortListings, type SortKey } from "@/components/listings/sortListings";
import ConstraintBar from "@/components/layers/ConstraintBar";
import {
  availableLayers,
  selectedOverlayIds,
  type CountrySlug,
  type Layer,
} from "@/components/layers/registry";
import {
  costFor,
  effectFor,
  evaluateLayer,
  funnelSteps,
  type FunnelStep,
  type LayerEffect,
} from "@/components/layers/evaluate";
import { layerTag } from "@/components/layers/layerTag";
import { useUrlSpecState } from "@/components/layers/useUrlSpecState";
import { getCountryAdapter, type CountryAdapter } from "@/countries";
import type { BaseListing } from "@/countries/types";
import type { USListing } from "@/countries/unitedStates";
import type { ITListing } from "@/countries/italy";
import {
  formatAcres,
  formatHectares,
  formatPrice,
  formatSubstationDistanceMetric,
} from "@/lib/format";

const LIMIT = 20;
// Below this zoom we render the country/state-zoom choropleth (counties
// for US, provinces for IT) and suppress the parcel-pin map. At/above
// this zoom the existing parcel layer takes over. The threshold sits
// just below the per-parcel layers' minZoom (NWI / slope_lt_5 = 11) so
// the choropleth → pins handoff lines up with constraint activation.
const CHOROPLETH_MAX_ZOOM = 10;

// On mobile only one surface is visible at a time. Floating buttons
// at the bottom of the viewport rotate through these three.
type MobileSurface = "constraints" | "map" | "list";

const ListingsSearch = () => {
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
  const {
    selectedIds,
    sortKey,
    toggleConstraint,
    clearConstraints,
    setSortKey,
  } = useUrlSpecState(layers);
  const [evaluating, setEvaluating] = useState<BaseListing | null>(null);
  const [listExpanded, setListExpanded] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const [mobileSurface, setMobileSurface] = useState<MobileSurface>("map");
  const [currentZoom, setCurrentZoom] = useState<number | undefined>(undefined);
  const [layerProgress, setLayerProgress] = useState<
    Record<string, LayerProgress>
  >({});

  const selectedLayers = useMemo<Layer[]>(
    () => layers.filter((l) => selectedIds.has(l.id)),
    [layers, selectedIds],
  );

  const overlayIds = useMemo(
    () => selectedOverlayIds(selectedIds, layers),
    [selectedIds, layers],
  );

  const scope = adapter.parseScope({ region, province });

  // PMTiles catalog is computed here (constraints → overlay ids) and
  // handed to the map. The map drives the deck.gl wiring against its
  // own google.maps.Map instance and emits per-layer progress back so
  // the constraint bar can show a tile-counter chip.
  const pmtilesRegionSlug =
    scope.level !== "national" ? scope.regionSlug : undefined;
  const pmtilesLayers = useMemo(
    () => pmtilesLayersFor(country, pmtilesRegionSlug),
    [country, pmtilesRegionSlug],
  );
  const pmtilesState = useMemo<Record<string, PMTilesLayerState>>(
    () =>
      Object.fromEntries(
        pmtilesLayers.map((l) => [l.id, { visible: overlayIds.has(l.id) }]),
      ),
    [pmtilesLayers, overlayIds],
  );
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

  // Cost-of-constraint per layer — depends on the current selection,
  // so recomputes on every toggle. Cheap for our scale (<100 listings,
  // <12 layers) and keeps the contract pure: ConstraintBar receives a
  // dict, no callback indirection.
  const costsById = useMemo<Record<string, number | null>>(() => {
    const out: Record<string, number | null> = {};
    for (const layer of layers) {
      out[layer.id] = costFor(allListings, layer, selectedLayers);
    }
    return out;
  }, [layers, allListings, selectedLayers]);

  // Cumulative narrowing through the selected stack — drives the
  // SpecFunnel under the constraint bar.
  const steps = useMemo<FunnelStep[]>(
    () => funnelSteps(allListings, selectedLayers),
    [allListings, selectedLayers],
  );

  // Listings rail shows the post-filter, post-sort set. A listing
  // passes the filter iff it passes every selected layer that can be
  // evaluated locally; layers without per-listing data don't filter
  // the list (they only drive the map overlay).
  const visibleListings = useMemo(() => {
    const evaluable = selectedLayers.filter((l) => l.chip);
    if (evaluable.length === 0) return sortListings(allListings, sortKey);
    const filtered = allListings.filter((listing) =>
      evaluable.every((layer) => evaluateLayer(listing, layer) !== "fail"),
    );
    return sortListings(filtered, sortKey);
  }, [allListings, selectedLayers, sortKey]);

  // Per-constraint elimination breakdown for the rail header. Only
  // includes constraints that are both selected AND evaluable.
  const eliminationByLayer = useMemo<{ layer: Layer; eliminated: number }[]>(
    () =>
      steps
        .filter((s) => s.eliminated > 0)
        .map((s) => ({ layer: s.layer, eliminated: s.eliminated })),
    [steps],
  );

  // Stable signature of the spec stack — drives a key-based remount of
  // the cards container so they re-animate in on filter/sort change.
  const specSignature = useMemo(
    () => `${sortKey}|${selectedLayers.map((l) => l.id).join(",")}`,
    [sortKey, selectedLayers],
  );

  const locationName = adapter.formatScopeName(scope);
  const seo = adapter.seoCopy(scope, visibleListings);
  const canonicalUrl = buildCanonicalUrl(country, region, province);
  const hasRegionScope = !!region;
  // Drawer identity comes from the clicked parcel's own admin fields,
  // not the page's URL scope — at state zoom every parcel would share
  // the same title otherwise. Summary lines (country-specific size +
  // price + grid distance) live here too because BaseListing is
  // intentionally agnostic of those fields.
  const drawerTitle = evaluating
    ? titleForListing(country, evaluating)
    : locationName;
  const drawerSummary = evaluating
    ? summaryForListing(country, evaluating)
    : undefined;

  const handleSelectListing = useCallback(
    (listing: BaseListing) => setEvaluating(listing),
    [],
  );
  // Marker click in the map fires with just the id (the country
  // adapter's map shape may not match BaseListing exactly). Resolve
  // here so the drawer always sees the page's authoritative listing.
  const handleSelectById = useCallback(
    (id: string) => {
      const found = allListings.find((l) => l.id === id);
      if (found) setEvaluating(found);
    },
    [allListings],
  );

  // US first-level admin unit is "state"; Italy uses "region". Drives
  // the constraint bar's "Pick a {state/region} first" hint copy.
  const regionLabel: "state" | "region" =
    country === "italy" ? "region" : "state";

  const constraintBar = (
    <ConstraintBar
      layers={layers}
      selectedIds={selectedIds}
      onToggle={toggleConstraint}
      onClear={clearConstraints}
      effectsById={effectsById}
      costsById={costsById}
      totalListings={allListings.length}
      currentZoom={currentZoom}
      hasRegionScope={hasRegionScope}
      regionLabel={regionLabel}
      layerProgress={layerProgress}
    />
  );

  // Choropleth wiring (roadmap p1-e3-layer-first-ui — frontend slice).
  // The aggregate endpoint payload is small (~3,143 county features,
  // ~107 IT provinces) and per-country, so we cache once and let the
  // map decide whether to render based on zoom. At/above
  // CHOROPLETH_MAX_ZOOM the existing parcel-pin map takes over.
  const choroplethVisible =
    currentZoom === undefined || currentZoom <= CHOROPLETH_MAX_ZOOM;
  const usCountyQuery = useUSCountyAggregate(
    country === "united-states" && choroplethVisible,
    scope.level !== "national" ? slugToStateCode(scope.regionSlug) : undefined,
  );
  const itProvinceQuery = useITProvinceAggregate(
    country === "italy" && choroplethVisible,
  );
  const navigate = useNavigate();
  const handleChoroplethClick = useCallback(
    (props: Record<string, unknown>) => {
      if (country === "united-states") {
        const stateCode = props.state_code as string | undefined;
        const countyName = props.county_name as string | undefined;
        if (!stateCode || !countyName) return;
        const stateSlug = stateCodeToSlug(stateCode);
        if (!stateSlug) return;
        navigate(`/united-states/${stateSlug}/${countyToSlug(countyName)}`);
        return;
      }
      // Italy — partition-name → URL slug match. The IT region URL
      // slugs are inconsistent (`emiliaromagna` vs `valle-daosta`), so
      // try a normalized name lookup against the static catalog.
      const partitionName = props.region as string | undefined;
      if (!partitionName) return;
      const normalized = partitionName.toLowerCase().replace(/-/g, "");
      const match = COUNTRIES.italy.regions.find(
        (r) => r.slug.replace(/-/g, "").toLowerCase() === normalized,
      );
      if (!match) return;
      navigate(`/italy/${match.slug}`);
    },
    [country, navigate],
  );
  const choroplethFeatures =
    country === "united-states"
      ? usCountyQuery.data
      : itProvinceQuery.data;

  // Floating HUD shown only in the preview. Rendered as `overlays`
  // so the map stays unaware of page-specific chrome.
  const choroplethCount = choroplethVisible
    ? choroplethFeatures?.features.length ?? 0
    : 0;
  const mapHud = (
    <MapHud
      country={country}
      regionSlug={pmtilesRegionSlug}
      zoom={currentZoom}
      choroplethVisible={choroplethVisible}
      choroplethCount={choroplethCount}
      listingCount={visibleListings.length}
      overlayCount={overlayIds.size}
    />
  );

  const map = adapter.renderMap({
    listings: visibleListings,
    scope,
    hexCells: heatmapQuery.data,
    showHeatmap: false,
    hexLoading: false,
    onZoomChange: setCurrentZoom,
    onListingClick: handleSelectById,
    pmtilesLayers,
    pmtilesState,
    onLayerProgressChange: setLayerProgress,
    overlays: mapHud,
    choropleth: choroplethFeatures
      ? {
          features: choroplethFeatures,
          visible: choroplethVisible,
          onFeatureClick: handleChoroplethClick,
        }
      : undefined,
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
      eliminationByLayer={eliminationByLayer}
      animationKey={specSignature}
    />
  );

  return (
    <>
      <SEOHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonicalUrl={canonicalUrl}
        structuredData={seo.structuredData}
      />

      <div className="min-h-screen flex flex-col bg-gradient-subtle">
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
        {/* Desktop workspace — three columns. Map and constraint rail
            stick to the viewport top so the page itself is the scroll
            container: cards in the listings rail scroll past the
            sticky map, and the footer is reachable at the bottom. */}
        <div className="hidden lg:flex items-start border-t border-border/60">
          {railOpen ? (
            <aside className="w-[300px] xl:w-[330px] flex-shrink-0 sticky top-0 self-start h-screen overflow-y-auto border-r border-border/60 bg-muted/10 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Project spec</span>
                <button
                  type="button"
                  onClick={() => setRailOpen(false)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Collapse constraints rail"
                >
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                </button>
              </div>
              {constraintBar}
            </aside>
          ) : (
            <button
              type="button"
              onClick={() => setRailOpen(true)}
              className="w-9 flex-shrink-0 sticky top-0 self-start h-screen border-r border-border/60 bg-muted/10 hover:bg-muted/30 transition-colors flex items-start justify-center pt-4"
              aria-label="Show constraints rail"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {!listExpanded && (
            <section className="flex-1 min-w-0 sticky top-0 self-start h-screen">
              <div className="absolute inset-0">{map}</div>
            </section>
          )}

          <aside
            className={cn(
              "flex-shrink-0 flex flex-col border-l border-border/60 bg-card",
              listExpanded ? "flex-1 min-w-0" : "w-[380px] xl:w-[420px]",
            )}
          >
            {listings}
          </aside>
        </div>

        {/* Mobile workspace — single visible surface chosen by the
            floating segmented control at the bottom. */}
        <div className="flex-1 lg:hidden border-t border-border/60">
          {mobileSurface === "constraints" && (
            <div className="p-3">{constraintBar}</div>
          )}
          {mobileSurface === "map" && (
            <div className="h-[calc(100vh-220px)] min-h-[420px]">{map}</div>
          )}
          {mobileSurface === "list" && (
            <div className="h-[calc(100vh-220px)] min-h-[420px] overflow-y-auto bg-card">
              {listings}
            </div>
          )}
        </div>

        <MobileSurfaceToggle
          surface={mobileSurface}
          onChange={setMobileSurface}
          constraintCount={selectedLayers.length}
        />

        <div className="container mx-auto px-4 py-6">
          <ListingsSEOContent
            locationName={locationName}
            listingsCount={allListings.length}
          />
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
      </div>

      <EvaluateDrawer
        listing={evaluating}
        selectedLayers={selectedLayers}
        title={drawerTitle}
        summary={drawerSummary}
        unit={country === "italy" ? "metric" : "imperial"}
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
}: PageHeaderProps) => {
  // The spec-chips header below carries the qualify/constraints
  // readout. The page header keeps the scope breadcrumb + the
  // headline, plus a single quiet "in scope" counter so the headline
  // anchors to a number even when no spec is set yet.
  const scopeCount =
    selectedCount > 0
      ? `${visibleCount.toLocaleString()} / ${totalListings.toLocaleString()}`
      : totalListings.toLocaleString();
  return (
    <header className="border-b border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <ListingsBreadcrumb country={country} region={region} province={province} />
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            <span className="text-primary">{locationName}</span>{" "}
            <span className="font-normal text-muted-foreground">{listingTerm}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {selectedCount > 0 ? "Qualify" : "In scope"}{" "}
            <span
              className={cn(
                "tabular-nums",
                selectedCount > 0
                  ? "text-primary font-semibold"
                  : "font-medium text-foreground",
              )}
            >
              {scopeCount}
            </span>
          </p>
        </div>
      </div>
    </header>
  );
};

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
  // Per-constraint elimination breakdown — already filtered to
  // entries with eliminated > 0 by the page. Empty array → no
  // breakdown line rendered (the rail header stays compact when
  // selections don't bite the cohort).
  eliminationByLayer: { layer: Layer; eliminated: number }[];
  // Stable signature of the spec stack; changing it remounts the
  // cards container so the stagger fade-in plays each time the
  // user changes their spec.
  animationKey: string;
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
  eliminationByLayer,
  animationKey,
}: ListingsRailProps) => (
  <>
    <header className="sticky top-0 z-10 border-b border-border/60 bg-gradient-subtle px-4 py-3 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-foreground">Listings</h2>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {isLoading ? (
            "loading…"
          ) : selectedConstraintCount === 0 ? (
            <>
              <span className="font-medium text-foreground">
                {total.toLocaleString()}
              </span>{" "}
              in scope
            </>
          ) : (
            <>
              <span className="text-primary font-semibold">
                {listings.length.toLocaleString()}
              </span>
              {" of "}
              {total.toLocaleString()} qualify
            </>
          )}
        </p>
        {!isLoading && eliminationByLayer.length > 0 && (
          <EliminationBreakdown items={eliminationByLayer} />
        )}
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

    <div className="p-3">
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          selectedCount={selectedConstraintCount}
          onClear={onClearConstraints}
        />
      ) : (
        <div
          key={animationKey}
          className={cn(
            "space-y-3",
            expanded && "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 space-y-0",
          )}
        >
          {listings.map((listing, i) => (
            <AnimatedCard key={listing.id} index={i}>
              {adapter.renderListingCard(listing, scope, i, { onSelect })}
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  </>
);

// Stagger-fade-in wrapper. The animation plays once per remount —
// the parent provides a key derived from the spec signature, so
// changing the spec replays the cascade and the user perceives the
// cohort "settling" into its new shape.
const STAGGER_MS = 28;
const MAX_STAGGER_MS = 360;

const AnimatedCard = ({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) => (
  <div
    className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300 ease-out fill-mode-both"
    style={{ animationDelay: `${Math.min(index * STAGGER_MS, MAX_STAGGER_MS)}ms` }}
  >
    {children}
  </div>
);

// Per-constraint "eliminated by" line. Uses the same mono layer-tag
// vocabulary as the constraint bar so the user reads the same names
// in both surfaces.
const EliminationBreakdown = ({
  items,
}: {
  items: { layer: Layer; eliminated: number }[];
}) => (
  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
    <span>Eliminated by</span>
    {items.map(({ layer, eliminated }, i) => (
      <span key={layer.id} className="inline-flex items-center gap-1">
        <span className="tp-mono rounded-sm border border-border/70 bg-background/70 px-1 py-px text-[9px] font-semibold tracking-wider text-muted-foreground">
          {layerTag(layer.id)}
        </span>
        <span className="tabular-nums text-destructive/80">
          −{eliminated.toLocaleString()}
        </span>
        {i < items.length - 1 && <span className="text-muted-foreground/40">·</span>}
      </span>
    ))}
  </p>
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
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:hidden z-40 inline-flex rounded-full border border-border/70 bg-card shadow-lg overflow-hidden">
    <SurfaceButton
      active={surface === "constraints"}
      onClick={() => onChange("constraints")}
      icon={<Layers className="h-4 w-4" />}
      label={
        constraintCount > 0
          ? `Spec · ${constraintCount}`
          : "Spec"
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

// Drawer identity + summary, country-specific. The runtime listing is
// already a USListing or ITListing (the adapter's useListings returns
// the country type even though the page narrows to BaseListing); we
// cast on the country slug we already trust at this layer.
function titleForListing(country: CountrySlug, listing: BaseListing): string {
  if (country === "united-states") {
    const us = listing as USListing;
    return `${us.county}, ${us.state_code}`;
  }
  const it = listing as ITListing;
  return it.comune_name;
}

function summaryForListing(country: CountrySlug, listing: BaseListing): string[] {
  if (country === "united-states") {
    const us = listing as USListing;
    const lines = [`~${formatAcres(us.lot_acres)} ac`];
    if (us.list_price !== null && us.list_price !== undefined) {
      lines.push(`~${formatPrice(us.list_price)}`);
    }
    if (us.power_substation != null) {
      const miles = us.power_substation * 0.000621371;
      lines.push(`~${miles.toFixed(1)} mi to substation`);
    }
    return lines;
  }
  const it = listing as ITListing;
  return [
    `~${formatHectares(it.area_ha)} ha`,
    `~${formatSubstationDistanceMetric(it.power_substation)} to substation`,
  ];
}

function buildCanonicalUrl(
  country: string,
  region?: string,
  province?: string,
): string {
  const base = "https://sunnyplans.com";
  const parts = [country, region, province].filter(Boolean);
  return `${base}/${parts.join("/")}`;
}

export default ListingsSearch;
