import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { HexCell } from "@/hooks/useHexHeatmap";

export type { HexCell };

export type Scope =
  | { level: "national" }
  | { level: "region"; regionSlug: string }
  | { level: "subregion"; regionSlug: string; subregionSlug: string };

export interface BaseListing {
  id: string;
  prob_solar: number | null;
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
  hexCells?: HexCell[];
  showHeatmap: boolean;
  hexLoading: boolean;
  onToggleHeatmap?: () => void;
  // Layer-first preview: when set, pmtiles overlay visibility is
  // driven by the parent's selection (page-level LayerPanel) instead
  // of the in-map toggles. See ListingsGoogleMap.pageControlledOverlayIds.
  pageControlledOverlayIds?: ReadonlySet<string>;
  // Zoom-aware UI hooks: the constraint bar uses the current map zoom
  // to surface a "zoom in to apply (zN+)" hint per layer. The map
  // calls this on every zoom_changed event. `undefined` means the map
  // hasn't initialized yet.
  onZoomChange?: (zoom: number | undefined) => void;
  // Marker click in the layer-first preview. The map fires this with
  // the listing's id; the page resolves it back to a BaseListing and
  // opens the EvaluateDrawer.
  onListingClick?: (id: string) => void;
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
  useHeatmap(enabled: boolean): UseQueryResult<HexCell[]>;

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
