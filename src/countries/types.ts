import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { PMTilesLayerConfig } from "@/components/maps/pmtilesLayers";
import type {
  LayerHeader,
  LayerProgress,
  PMTilesLayerState,
} from "@/components/maps/usePMTilesOverlays";
import type { Layer } from "@/components/layers/registry";

export type Scope =
  | { level: "national" }
  | { level: "region"; regionSlug: string }
  | { level: "subregion"; regionSlug: string; subregionSlug: string };

export interface BaseListing {
  id: string;
  prob_solar: number | null;
  // SunnyScore™ 0–100 (round(prob_solar × 100)) and per-feature
  // TreeSHAP contributions in raw logit units. Both null until the
  // pipeline rematerializes the marts; FE renders a degraded view.
  // Free-tier visible per p2-e1-sunnyscore-visual.md.
  score: number | null;
  contributions: Record<string, number> | null;
  geom_json: unknown | null;
  // Disc-jitter radius in meters around geom_json. Public mart only — null
  // on full-mart (unlocked) rows, where geom_json is the exact polygon.
  location_accuracy_m: number | null;
  rank_global: number | null;
  // Acres of <5% slope on the parcel — sidecar from the slope_lt_5
  // pipeline (p1-e2-slope-flat-5pct-layer). Cross-country numeric so
  // the layer chip can read it without per-country branching.
  flat_5_acres: number | null;
}

export interface SeoCopy {
  title: string;
  description: string;
  keywords: string;
  structuredData: Record<string, unknown>;
}

export interface MapRenderProps {
  listings: BaseListing[];
  scope: Scope;
  // Zoom-aware UI hooks: the constraint bar uses the current map zoom
  // to surface a "zoom in to apply (zN+)" hint per layer. The map
  // calls this on every zoom_changed event. `undefined` means the map
  // hasn't initialized yet.
  onZoomChange?: (zoom: number | undefined) => void;
  // Marker click in the layer-first preview. The map fires this with
  // the listing's id; the page resolves it back to a BaseListing and
  // opens the EvaluateDrawer.
  onListingClick?: (id: string) => void;
  // Country/state-zoom choropleth. When `visible`, the map renders the
  // FeatureCollection as a polygon Data layer tinted by `max_sunnyscore`
  // and suppresses parcel markers. The page owns the zoom gate and the
  // click→navigation contract; the map is purely a renderer here.
  choropleth?: ChoroplethSurface;
  // PMTiles overlays. The page owns selection state and the (region-
  // narrowed) catalog; the map drives the deck.gl wiring against its
  // own map instance and emits `headers` / `progress` back so the page
  // can render LayerPanel and progress chips against the same data.
  pmtilesLayers?: PMTilesLayerConfig[];
  pmtilesState?: Record<string, PMTilesLayerState>;
  onLayerHeadersChange?: (headers: Record<string, LayerHeader>) => void;
  onLayerProgressChange?: (progress: Record<string, LayerProgress>) => void;
  // Optional absolutely-positioned overlays rendered on top of the
  // map (HUD, LayerPanel, custom chrome). Pages own the imperative
  // subsystems these UIs read from; the map is just the canvas.
  overlays?: ReactNode;
}

// Minimal GeoJSON shape — we don't pull in @types/geojson just for two
// fields. Geometry is whatever the API returned; the map's Data layer
// handles parsing.
export interface ChoroplethFeatureLike {
  type: "Feature";
  geometry: unknown;
  properties: Record<string, unknown>;
}

export interface ChoroplethSurface {
  features: {
    type: "FeatureCollection";
    features: ChoroplethFeatureLike[];
  };
  visible: boolean;
  onFeatureClick?: (properties: Record<string, unknown>) => void;
}

export interface HeadingStrings {
  /** Prefix shown when at least one listing is found, before the bold location name. */
  topRated: string;
  /** Prefix shown when no listings match, before the bold location name. */
  nearLocation: string;
}

export interface DetailPageProps<TListing = unknown> {
  id: string;
  listing: TListing;
  onPaymentSuccess: () => void;
}

export interface CountryAdapter {
  slug: string;
  name: string;
  listingTerm: string;
  heading: HeadingStrings;

  parseScope(params: { region?: string; province?: string }): Scope;

  // `extraParams` carries layer-driven filters (e.g. min_flat_5_acres
  // when the slope_lt_5 layer is selected). Adapters merge these into
  // the listings query URL and the React Query cache key. Optional —
  // legacy callers that pass nothing get an unfiltered list.
  useListings(
    scope: Scope,
    limit: number,
    extraParams?: URLSearchParams,
  ): UseQueryResult<BaseListing[]>;

  formatScopeName(scope: Scope): string;
  formatParentName(scope: Scope): string;
  rankSortLabel(scope: Scope): string;

  renderListingCard(
    listing: BaseListing,
    scope: Scope,
    listIndex: number,
    options?: RenderCardOptions,
  ): ReactNode;
  renderMap(props: MapRenderProps): ReactNode;
  seoCopy(scope: Scope, listings: BaseListing[]): SeoCopy;
}

// Per-card opts the page can hand to `renderListingCard`. Kept as an
// options bag (not a positional arg) so future per-card behaviors —
// comparison checkbox, hover-preview, etc. — slot in without churning
// adapter signatures.
export interface RenderCardOptions {
  // Layer-first preview hook: when provided, clicking the card calls
  // this instead of routing to /listing/:id. The receiving page opens
  // the EvaluateDrawer for the listing.
  onSelect?: (listing: BaseListing) => void;
  // Active constraint filters — drives per-card pass/fail badges so the
  // rail reads "this is why this parcel survived your filters". Omit on
  // surfaces without a constraint bar (DemoSection, production listings
  // page) and the badge row renders nothing.
  selectedLayers?: ReadonlyArray<Layer>;
}

export function parseScopeFromParams(params: { region?: string; province?: string }): Scope {
  if (params.region && params.province) {
    return { level: "subregion", regionSlug: params.region, subregionSlug: params.province };
  }
  if (params.region) {
    return { level: "region", regionSlug: params.region };
  }
  return { level: "national" };
}
